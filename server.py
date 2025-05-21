from flask import Flask, jsonify, request
from flask_cors import CORS  # поддержка cors
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'your-secret-key-here'

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'database': 'kpop_shop',
    'user': 'postgres',
    'password': '12345',
    'port': '5432'
}

def get_db_connection():
    conn = psycopg2.connect(**DB_CONFIG)
    return conn

# Auth decorator 
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        
        if not auth:
            return jsonify({'message': 'Authentication required!'}), 401
            
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('SELECT * FROM users WHERE email = %s', (auth.username,))
        user = cur.fetchone()
        cur.close()
        conn.close()
        
        if not user:
            return jsonify({'message': 'User not found!'}), 404
            
        # Прямое сравнение паролей (без хеширования)
        if user['password_hash'] != auth.password:
            return jsonify({'message': 'Wrong password!'}), 401
            
        return f(user, *args, **kwargs)
        
    return decorated

# Регистрация (без хеширования)
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute(
            "INSERT INTO users (email, password_hash, first_name, last_name) VALUES (%s, %s, %s, %s) RETURNING id",
            (data['email'], data['password'], data.get('first_name'), data.get('last_name')))
        user_id = cur.fetchone()[0]
        conn.commit()
    except psycopg2.IntegrityError:
        conn.rollback()
        return jsonify({'message': 'Email already exists!'}), 400
    finally:
        cur.close()
        conn.close()
    
    return jsonify({'message': 'User created successfully!', 'user_id': user_id}), 201

# Вход (без хеширования)
@app.route('/api/login', methods=['GET'])
def login():
    auth = request.authorization
    
    if not auth:
        return jsonify({'message': 'Credentials required!'}), 401
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT * FROM users WHERE email = %s', (auth.username,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    
    if not user:
        return jsonify({'message': 'User not found!'}), 404
    
    # Прямое сравнение паролей
    if user['password_hash'] != auth.password:
        return jsonify({'message': 'Wrong password!'}), 401
    
    return jsonify({
        'message': 'Login successful!',
        'user_id': user['id'],
        'is_admin': user['is_admin']
    })

def admin_required(f):
    @wraps(f)
    def decorated(user, *args, **kwargs):
        if not user['is_admin']:
            return jsonify({'message': 'Admin access required!'}), 403
        return f(user, *args, **kwargs)
    return decorated


# Admin routes
@app.route('/api/admin/albums', methods=['POST'])
@login_required
@admin_required
def add_album(user):
    data = request.get_json()
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Add album
        cur.execute('''
            INSERT INTO albums (
                artist_id, title, base_price, description, 
                release_date, status, main_image_url, is_preorder
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (
            data['artist_id'], data['title'], data['base_price'], data.get('description'),
            data.get('release_date'), data.get('status', 'in_stock'), 
            data.get('main_image_url'), data.get('is_preorder', False)
        ))
        album_id = cur.fetchone()[0]
        
        # Add versions
        for version in data.get('versions', []):
            cur.execute('''
                INSERT INTO album_versions (
                    album_id, version_name, price_diff, packaging_details,
                    stock_quantity, is_limited
                )
                VALUES (%s, %s, %s, %s, %s, %s)
            ''', (
                album_id, version['version_name'], version.get('price_diff', 0),
                version.get('packaging_details'), version.get('stock_quantity', 0),
                version.get('is_limited', False)
            ))
        
        conn.commit()
        return jsonify({'message': 'Album added successfully!', 'album_id': album_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'message': str(e)}), 400
    finally:
        cur.close()
        conn.close()


# Public routes
@app.route('/api/albums', methods=['GET'])
def get_albums():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Get basic album info with artist name
    cur.execute('''
        SELECT a.id, ar.name as artist, a.title, a.base_price, 
               a.main_image_url, a.status, a.release_date
        FROM albums a
        JOIN artists ar ON a.artist_id = ar.id
        WHERE a.status != 'out_of_stock'
        ORDER BY a.release_date DESC
    ''')
    albums = cur.fetchall()
    
    # Get versions for each album
    for album in albums:
        cur.execute('''
            SELECT id, version_name, price_diff, stock_quantity
            FROM album_versions
            WHERE album_id = %s
        ''', (album['id'],))
        album['versions'] = cur.fetchall()
    
    cur.close()
    conn.close()
    
    return jsonify(albums)

@app.route('/api/albums/<int:album_id>', methods=['GET'])
def get_album(album_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Album details
    cur.execute('''
        SELECT a.*, ar.name as artist_name, ar.image_url as artist_image
        FROM albums a
        JOIN artists ar ON a.artist_id = ar.id
        WHERE a.id = %s
    ''', (album_id,))
    album = cur.fetchone()
    
    if not album:
        return jsonify({'message': 'Album not found!'}), 404
    
    # Album versions
    cur.execute('''
        SELECT * FROM album_versions
        WHERE album_id = %s
    ''', (album_id,))
    album['versions'] = cur.fetchall()
    
    cur.close()
    conn.close()
    
    return jsonify(album)

# Protected routes
@app.route('/api/cart', methods=['GET', 'POST'])
@login_required
def cart_operations(user):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    if request.method == 'GET':
        # Get or create cart
        cur.execute('SELECT id FROM cart WHERE user_id = %s', (user['id'],))
        cart = cur.fetchone()
        
        if not cart:
            return jsonify({'items': [], 'total': 0})
        
        # Get cart items
        cur.execute('''
            SELECT ci.id, ci.quantity, 
                   av.id as version_id, av.version_name,
                   a.id as album_id, a.title as album_title, 
                   a.base_price + av.price_diff as price,
                   a.main_image_url
            FROM cart_items ci
            JOIN album_versions av ON ci.album_version_id = av.id
            JOIN albums a ON av.album_id = a.id
            WHERE ci.cart_id = %s
        ''', (cart['id'],))
        items = cur.fetchall()
        
        # Calculate total
        total = sum(item['price'] * item['quantity'] for item in items)
        
        cur.close()
        conn.close()
        
        return jsonify({'items': items, 'total': total})
    
    elif request.method == 'POST':
        data = request.get_json()
        
        try:
            # Get or create cart
            cur.execute('SELECT id FROM cart WHERE user_id = %s', (user['id'],))
            cart = cur.fetchone()
            
            if not cart:
                cur.execute('INSERT INTO cart (user_id) VALUES (%s) RETURNING id', (user['id'],))
                cart_id = cur.fetchone()[0]
            else:
                cart_id = cart['id']
            
            # Add item to cart
            cur.execute('''
                INSERT INTO cart_items (cart_id, album_version_id, quantity)
                VALUES (%s, %s, %s)
                ON CONFLICT (cart_id, album_version_id) 
                DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
            ''', (cart_id, data['version_id'], data.get('quantity', 1)))
            
            conn.commit()
            return jsonify({'message': 'Item added to cart!'})
        except Exception as e:
            conn.rollback()
            return jsonify({'message': str(e)}), 400
        finally:
            cur.close()
            conn.close()


if __name__ == '__main__':
    app.run(debug=True)