from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from datetime import timedelta
import logging
from flask_jwt_extended import (
    JWTManager, create_access_token, 
    jwt_required, get_jwt_identity,
    get_jwt
)

app = Flask(__name__)

# Настройка логирования
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['JWT_SECRET_KEY'] = 'your-jwt-secret-key'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
jwt = JWTManager(app)

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'database': 'kpop_shop',
    'user': 'postgres',
    'password': '12345',
    'port': '5432'
}

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

# Универсальный обработчик CORS
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response

# Обработка OPTIONS запросов
@app.route('/api/register', methods=['OPTIONS'])
def handle_register_options():
    return '', 200

@app.route('/api/login', methods=['OPTIONS'])
def handle_login_options():
    return '', 200

@app.route('/api/admin/artists', methods=['OPTIONS'])
@app.route('/api/admin/albums', methods=['OPTIONS'])
def handle_admin_options():
    response = make_response()
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response

# Регистрация пользователя
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    app.logger.debug(f"Registration data: {data}")
    
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'message': 'Email and password are required!'}), 400
    
    email = data['email']
    password = data['password']
    first_name = data.get('firstName') or data.get('first_name') or ''
    last_name = data.get('lastName') or data.get('last_name') or ''
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            return jsonify({'message': 'Email already exists!'}), 400
        
        hashed_password = generate_password_hash(password)
        
        cur.execute(
            "INSERT INTO users (email, password_hash, first_name, last_name, is_admin) "
            "VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (email, hashed_password, first_name, last_name, False)
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        
        cur.execute("INSERT INTO cart (user_id) VALUES (%s) RETURNING id", (user_id,))
        cart_id = cur.fetchone()[0]
        conn.commit()
        
        return jsonify({
            'message': 'User created successfully!',
            'user_id': user_id,
            'cart_id': cart_id
        }), 201
        
    except Exception as e:
        conn.rollback()
        app.logger.error(f"Registration error: {str(e)}", exc_info=True)
        return jsonify({'message': 'Registration failed. Please try again.'}), 500
    finally:
        cur.close()
        conn.close()

# Вход пользователя
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    app.logger.debug(f"Login data: {data}")
    
    
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'message': 'Email and password are required!'}), 400
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        
        if not user:
            return jsonify({'message': 'User not found!'}), 404
        
        if not check_password_hash(user['password_hash'], password):
            return jsonify({'message': 'Wrong password!'}), 401
         
        identity = str(user['id'])
         
        additional_claims = {
        'email': user['email'],
        'is_admin': bool(user['is_admin'])
        }
         
        user_data = {
        "id": user['id'],
        "email": user['email'],
        "isAdmin": bool(user['is_admin'])
        }
        
        access_token = create_access_token(
        identity=identity,
        additional_claims=additional_claims
        )
        
        return jsonify({
        'accessToken': access_token,
        'user': user_data
        }), 200
        
    except Exception as e:
        app.logger.error(f"Login error: {str(e)}", exc_info=True)
        return jsonify({'message': 'Login failed. Please try again.'}), 500
    finally:
        cur.close()
        conn.close()

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            # Получаем claims из токена
            claims = get_jwt()
            
            # Проверяем is_admin в claims
            if not claims.get('is_admin', False):
                return jsonify({'message': 'Admin access required!'}), 403
                
            return fn(*args, **kwargs)
            
        except Exception as e:
            app.logger.error(f"Admin check error: {str(e)}")
            return jsonify({'message': 'Authorization failed'}), 401
    return wrapper



@app.route('/api/check-auth', methods=['GET'])
@jwt_required()
def check_auth():
    identity = get_jwt_identity()
    claims = get_jwt()
    return jsonify({
        'identity': identity,
        'claims': claims,
        'is_admin': claims.get('is_admin', False)
    })


# Public routes
@app.route('/api/albums', methods=['GET'])
def get_albums():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute('''
        SELECT a.id, ar.name as artist, a.title, a.base_price, 
               a.main_image_url, a.status, a.release_date
        FROM albums a
        JOIN artists ar ON a.artist_id = ar.id
        WHERE a.status != 'out_of_stock'
        ORDER BY a.release_date DESC
    ''')
    albums = cur.fetchall()
    
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
    
    cur.execute('''
        SELECT a.*, ar.name as artist_name, ar.image_url as artist_image
        FROM albums a
        JOIN artists ar ON a.artist_id = ar.id
        WHERE a.id = %s
    ''', (album_id,))
    album = cur.fetchone()
    
    if not album:
        return jsonify({'message': 'Album not found!'}), 404
    
    cur.execute('SELECT * FROM album_versions WHERE album_id = %s', (album_id,))
    album['versions'] = cur.fetchall()
    
    cur.close()
    conn.close()
    return jsonify(album)

@app.route('/api/artists/<category>', methods=['GET'])
def get_artists_by_category(category):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    valid_categories = ['female_group', 'male_group', 'solo']
    if category not in valid_categories:
        return jsonify({'error': 'Invalid category'}), 400
    
    cur.execute('SELECT * FROM artists WHERE category = %s', (category,))
    artists = cur.fetchall()
    
    cur.close()
    conn.close()
    return jsonify(artists)

@app.route('/api/artist_categories', methods=['GET'])
def get_artist_categories():
    return jsonify([
        {'id': 'female_group', 'name': 'Женские группы'},
        {'id': 'male_group', 'name': 'Мужские группы'},
        {'id': 'solo', 'name': 'Сольные исполнители'}
    ])

@app.route('/api/artists/<int:artist_id>', methods=['GET'])
def get_artist(artist_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute('SELECT * FROM artists WHERE id = %s', (artist_id,))
        artist = cur.fetchone()
        
        if not artist:
            return jsonify({'error': 'Artist not found'}), 404
            
        cur.execute('''
            SELECT a.*, ar.name as artist_name, ar.image_url as artist_image
            FROM albums a
            JOIN artists ar ON a.artist_id = ar.id
            WHERE a.artist_id = %s
            ORDER BY a.release_date DESC
        ''', (artist_id,))
        albums = cur.fetchall()
        
        for album in albums:
            cur.execute('SELECT * FROM album_versions WHERE album_id = %s', (album['id'],))
            album['versions'] = cur.fetchall()
        
        return jsonify({
            'artist': artist,
            'albums': albums
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/cart/<int:item_id>', methods=['DELETE'])
@jwt_required()
def remove_from_cart(item_id):
    current_user = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute('''
            DELETE FROM cart_items 
            WHERE id = %s AND cart_id IN (
                SELECT id FROM cart WHERE user_id = %s
            )
            RETURNING *
        ''', (item_id, current_user['id']))
        
        if not cur.fetchone():
            return jsonify({'message': 'Item not found in your cart!'}), 404
            
        conn.commit()
        return jsonify({'message': 'Item removed from cart!'})
    except Exception as e:
        conn.rollback()
        return jsonify({'message': str(e)}), 400
    finally:
        cur.close()
        conn.close()

@app.route('/api/cart', methods=['GET', 'POST'])
@jwt_required()
def cart_operations():
    current_user = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute('SELECT id FROM users WHERE id = %s', (current_user['id'],))
        if not cur.fetchone():
            return jsonify({'message': 'User not found!'}), 404

        if request.method == 'GET':
            cur.execute('''
                SELECT ci.id, ci.quantity, 
                       av.id as version_id, av.version_name,
                       a.id as album_id, a.title as album_title, 
                       a.base_price + av.price_diff as price,
                       a.main_image_url
                FROM cart_items ci
                JOIN album_versions av ON ci.album_version_id = av.id
                JOIN albums a ON av.album_id = a.id
                JOIN cart c ON ci.cart_id = c.id
                WHERE c.user_id = %s
            ''', (current_user['id'],))
            items = cur.fetchall()
            
            total = sum(item['price'] * item['quantity'] for item in items)
            
            return jsonify({
                'items': items,
                'total': total,
                'cart_id': items[0]['cart_id'] if items else None
            })

        elif request.method == 'POST':
            data = request.get_json()
            if not data or 'version_id' not in data:
                return jsonify({
                    'message': 'version_id is required',
                    'received_data': data
                }), 422

            cur.execute('SELECT id FROM cart WHERE user_id = %s', (current_user['id'],))
            cart = cur.fetchone()
            
            if not cart:
                cur.execute('INSERT INTO cart (user_id) VALUES (%s) RETURNING id', (current_user['id'],))
                cart_id = cur.fetchone()['id']
            else:
                cart_id = cart['id']
            
            cur.execute('''
                INSERT INTO cart_items (cart_id, album_version_id, quantity)
                VALUES (%s, %s, %s)
                ON CONFLICT (cart_id, album_version_id) 
                DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
                RETURNING id
            ''', (cart_id, data['version_id'], data.get('quantity', 1)))
            
            conn.commit()
            return jsonify({'message': 'Item added to cart!'})

    except Exception as e:
        conn.rollback()
        return jsonify({'message': str(e)}), 400
    finally:
        cur.close()
        conn.close()

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute('''
            SELECT id, email, first_name, last_name, is_admin 
            FROM users 
            WHERE id = %s
        ''', (current_user['id'],))
        user = cur.fetchone()
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        return jsonify({
            'id': user['id'],
            'email': user['email'],
            'firstName': user['first_name'],
            'lastName': user['last_name'],
            'isAdmin': user['is_admin']
        })
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/validate-token', methods=['GET'])
@jwt_required()
def validate_token():
    return jsonify({'valid': True}), 200

# Admin routes
@app.route('/api/admin/artists', methods=['GET', 'POST'])
@jwt_required()
@admin_required
def admin_artists():
    current_user = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if request.method == 'GET':
            cur.execute('SELECT * FROM artists')
            artists = cur.fetchall()
            return jsonify(artists)
        
        elif request.method == 'POST':
            data = request.get_json()
            if not data or 'name' not in data or 'category' not in data:
                return jsonify({'message': 'Name and category are required!'}), 400
            
            cur.execute(
                "INSERT INTO artists (name, category, description, image_url) "
                "VALUES (%s, %s, %s, %s) RETURNING *",
                (data['name'], data['category'], data.get('description'), data.get('image_url'))
            )
            new_artist = cur.fetchone()
            conn.commit()
            return jsonify(new_artist), 201
            
    except Exception as e:
        conn.rollback()
        app.logger.error(f"Admin artists error: {str(e)}")
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/admin/albums', methods=['GET', 'POST'])
@jwt_required()
@admin_required
def admin_albums():
    current_user = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if request.method == 'GET':
            cur.execute('''
                SELECT a.*, ar.name as artist_name 
                FROM albums a
                JOIN artists ar ON a.artist_id = ar.id
            ''')
            albums = cur.fetchall()
            
            for album in albums:
                cur.execute('SELECT * FROM album_versions WHERE album_id = %s', (album['id'],))
                album['versions'] = cur.fetchall()
            
            return jsonify(albums)
        
        elif request.method == 'POST':
            data = request.get_json()
            
            # Валидация обязательных полей
            if not data or 'artist_id' not in data or 'title' not in data or 'base_price' not in data:
                return jsonify({'message': 'Missing required fields'}), 400
                
            # Вставка альбома
            cur.execute('''
                INSERT INTO albums (
                    artist_id, title, base_price, description, 
                    release_date, status, main_image_url, is_preorder
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            ''', (
                data['artist_id'], 
                data['title'], 
                data['base_price'], 
                data.get('description', ''),
                data.get('release_date'), 
                data.get('status', 'in_stock'),
                data.get('main_image_url', ''), 
                data.get('is_preorder', False)
            ))
            album_id = cur.fetchone()['id']
            
            # Вставка версий (только существующие в БД поля)
            for version in data.get('versions', []):
                cur.execute('''
                    INSERT INTO album_versions (
                        album_id, version_name, price_diff, packaging_details,
                        stock_quantity, is_limited
                    )
                    VALUES (%s, %s, %s, %s, %s, %s)
                ''', (
                    album_id,
                    version.get('version_name', ''),
                    float(version.get('price_diff', 0)),
                    version.get('packaging_details', ''),
                    int(version.get('stock_quantity', 0)),
                    bool(version.get('is_limited', False))
                ))
            
            conn.commit()
            
            # Возвращаем созданный альбом
            cur.execute('SELECT * FROM albums WHERE id = %s', (album_id,))
            album = cur.fetchone()
            cur.execute('SELECT * FROM album_versions WHERE album_id = %s', (album_id,))
            album['versions'] = cur.fetchall()
            
            return jsonify(album), 201
            
    except Exception as e:
        conn.rollback()
        app.logger.error(f"Admin albums error: {str(e)}", exc_info=True)
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()
        
# Изменение артистов

@app.route('/api/admin/artists/<int:id>', methods=['GET', 'PUT'])
@jwt_required()
@admin_required
def admin_artist(id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if request.method == 'GET':
            cur.execute('SELECT * FROM artists WHERE id = %s', (id,))
            artist = cur.fetchone()
            if not artist:
                return jsonify({'message': 'Artist not found'}), 404
            return jsonify(artist)
            
        elif request.method == 'PUT':
            data = request.get_json()
            if not data or 'name' not in data or 'category' not in data:
                return jsonify({'message': 'Name and category are required!'}), 400
            
            cur.execute(
                "UPDATE artists SET name = %s, category = %s, description = %s, image_url = %s "
                "WHERE id = %s RETURNING *",
                (data['name'], data['category'], data.get('description'), data.get('image_url'), id)
            )
            updated_artist = cur.fetchone()
            conn.commit()
            
            if not updated_artist:
                return jsonify({'message': 'Artist not found'}), 404
                
            return jsonify(updated_artist)
            
    except Exception as e:
        conn.rollback()
        app.logger.error(f"Admin artist error: {str(e)}")
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()

# Изменение альбомов

@app.route('/api/admin/albums/<int:id>', methods=['GET', 'PUT'])
@jwt_required()
@admin_required
def admin_album(id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if request.method == 'GET':
            cur.execute('''
                SELECT a.*, ar.name as artist_name 
                FROM albums a
                JOIN artists ar ON a.artist_id = ar.id
                WHERE a.id = %s
            ''', (id,))
            album = cur.fetchone()
            
            if not album:
                return jsonify({'message': 'Album not found'}), 404
                
            cur.execute('SELECT * FROM album_versions WHERE album_id = %s', (id,))
            album['versions'] = cur.fetchall()
            
            return jsonify(album)
            
        elif request.method == 'PUT':
            data = request.get_json()
            
            # Валидация обязательных полей
            if not data or 'artist_id' not in data or 'title' not in data or 'base_price' not in data:
                return jsonify({'message': 'Missing required fields'}), 400
                
            # Обновление альбома
            cur.execute('''
                UPDATE albums SET
                    artist_id = %s, 
                    title = %s, 
                    base_price = %s, 
                    description = %s, 
                    release_date = %s, 
                    status = %s, 
                    main_image_url = %s, 
                    is_preorder = %s
                WHERE id = %s
                RETURNING *
            ''', (
                data['artist_id'], 
                data['title'], 
                data['base_price'], 
                data.get('description', ''),
                data.get('release_date'), 
                data.get('status', 'in_stock'),
                data.get('main_image_url', ''), 
                data.get('is_preorder', False),
                id
            ))
            updated_album = cur.fetchone()
            
            if not updated_album:
                return jsonify({'message': 'Album not found'}), 404
                
            # Удаляем старые версии и добавляем новые
            cur.execute('DELETE FROM album_versions WHERE album_id = %s', (id,))
            
            for version in data.get('versions', []):
                cur.execute('''
                    INSERT INTO album_versions (
                        album_id, version_name, price_diff, packaging_details,
                        stock_quantity, is_limited
                    )
                    VALUES (%s, %s, %s, %s, %s, %s)
                ''', (
                    id,
                    version.get('version_name', ''),
                    float(version.get('price_diff', 0)),
                    version.get('packaging_details', ''),
                    int(version.get('stock_quantity', 0)),
                    bool(version.get('is_limited', False))
                ))
            
            conn.commit()
            
            # Возвращаем обновленный альбом
            cur.execute('SELECT * FROM album_versions WHERE album_id = %s', (id,))
            updated_album['versions'] = cur.fetchall()
            
            return jsonify(updated_album)
            
    except Exception as e:
        conn.rollback()
        app.logger.error(f"Admin album error: {str(e)}", exc_info=True)
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()


        
if __name__ == '__main__':
    app.run(debug=True)