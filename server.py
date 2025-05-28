from flask import Flask, jsonify, request
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

# Минимальная CORS обработка
@app.after_request
def add_cors_headers(response):
    """Добавляем CORS заголовки только к API запросам"""
    if request.path.startswith('/api/'):
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
        
        # Генерируем хеш пароля
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
        
        # Проверяем пароль с помощью хеша
        if not check_password_hash(user['password_hash'], password):
            return jsonify({'message': 'Wrong password!'}), 401
        
        user_data = {
            "id": user['id'],
            "email": user['email'],
            "firstName": user.get('first_name', ''),
            "lastName": user.get('last_name', ''),
            "isAdmin": bool(user['is_admin'])
        }
        
        access_token = create_access_token(identity={
            'id': user['id'],
            'email': user['email'],
            'is_admin': user['is_admin']
        })
        
        response = jsonify({
            'accessToken': access_token,
            'user': user_data
        })
        
        return response, 200
        
    except Exception as e:
        app.logger.error(f"Login error: {str(e)}", exc_info=True)
        return jsonify({'message': 'Login failed. Please try again.'}), 500
    finally:
        cur.close()
        conn.close()

# Избранное (только для авторизованных)
# @app.route('/api/wishlist', methods=['GET', 'POST', 'DELETE'])
# @login_required
# def wishlist_operations(user):
#     conn = get_db_connection()
#     cur = conn.cursor(cursor_factory=RealDictCursor)
    
#     if request.method == 'GET':
#         try:
#             cur.execute('''
#                 SELECT w.id, a.id as album_id, a.title, a.main_image_url, a.base_price
#                 FROM wishlist w
#                 JOIN albums a ON w.album_id = a.id
#                 WHERE w.user_id = %s
#             ''', (user['id'],))
#             items = cur.fetchall()
            
#             return jsonify(items)
#         except Exception as e:
#             return jsonify({'message': str(e)}), 500
#         finally:
#             cur.close()
#             conn.close()
    
#     elif request.method == 'POST':
#         data = request.get_json()
#         if not data or 'album_id' not in data:
#             return jsonify({'message': 'Album ID is required!'}), 400
        
#         try:
#             cur.execute('''
#                 INSERT INTO wishlist (user_id, album_id)
#                 VALUES (%s, %s)
#                 ON CONFLICT (user_id, album_id) DO NOTHING
#                 RETURNING id
#             ''', (user['id'], data['album_id']))
            
#             if cur.rowcount == 0:
#                 return jsonify({'message': 'Album already in wishlist!'}), 400
                
#             conn.commit()
#             return jsonify({'message': 'Album added to wishlist!'})
#         except Exception as e:
#             conn.rollback()
#             return jsonify({'message': str(e)}), 400
#         finally:
#             cur.close()
#             conn.close()
    
#     elif request.method == 'DELETE':
#         album_id = request.args.get('album_id')
#         if not album_id:
#             return jsonify({'message': 'Album ID is required!'}), 400
        
#         try:
#             cur.execute('''
#                 DELETE FROM wishlist 
#                 WHERE user_id = %s AND album_id = %s
#                 RETURNING id
#             ''', (user['id'], album_id))
            
#             if cur.rowcount == 0:
#                 return jsonify({'message': 'Album not found in wishlist!'}), 404
                
#             conn.commit()
#             return jsonify({'message': 'Album removed from wishlist!'})
#         except Exception as e:
#             conn.rollback()
#             return jsonify({'message': str(e)}), 400
#         finally:
#             cur.close()
#             conn.close()

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # verify_jwt_in_request()  # Теперь функция определена
        claims = get_jwt()       # Получаем данные из токена
        if not claims.get('is_admin', False):  # Безопасное получение флага is_admin
            return jsonify({'message': 'Admin access required!'}), 403
        return fn(*args, **kwargs)
    return wrapper


# Admin routes
@app.route('/api/admin/albums', methods=['POST'])
# @login_required
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

# Получение артистов по категориям
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

# Получение всех категорий
@app.route('/api/artist_categories', methods=['GET'])
def get_artist_categories():
    return jsonify([
        {'id': 'female_group', 'name': 'Женские группы'},
        {'id': 'male_group', 'name': 'Мужские группы'},
        {'id': 'solo', 'name': 'Сольные исполнители'}
    ])


# Получение информации об исполнителе и его альбомах
@app.route('/api/artists/<int:artist_id>', methods=['GET'])
def get_artist(artist_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Получаем информацию об исполнителе
        cur.execute('SELECT * FROM artists WHERE id = %s', (artist_id,))
        artist = cur.fetchone()
        
        if not artist:
            return jsonify({'error': 'Artist not found'}), 404
            
        # Получаем альбомы исполнителя
        cur.execute('''
            SELECT a.*, ar.name as artist_name, ar.image_url as artist_image
            FROM albums a
            JOIN artists ar ON a.artist_id = ar.id
            WHERE a.artist_id = %s
            ORDER BY a.release_date DESC
        ''', (artist_id,))
        albums = cur.fetchall()
        
        # Добавляем информацию о версиях для каждого альбома
        for album in albums:
            cur.execute('''
                SELECT * FROM album_versions
                WHERE album_id = %s
            ''', (album['id'],))
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
# @login_required
def remove_from_cart(user, item_id):
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Проверяем, что товар принадлежит корзине пользователя
        cur.execute('''
            DELETE FROM cart_items 
            WHERE id = %s AND cart_id IN (
                SELECT id FROM cart WHERE user_id = %s
            )
            RETURNING *
        ''', (item_id, user['id']))
        
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


# Корзина (только для авторизованных)
@app.route('/api/cart', methods=['GET', 'POST'])
@jwt_required()
def cart_operations():
    current_user = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Проверка существования пользователя
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

            # Получаем или создаем корзину
            cur.execute('SELECT id FROM cart WHERE user_id = %s', (current_user['id'],))
            cart = cur.fetchone()
            
            if not cart:
                cur.execute('INSERT INTO cart (user_id) VALUES (%s) RETURNING id', (current_user['id'],))
                cart_id = cur.fetchone()['id']
            else:
                cart_id = cart['id']
            
            # Добавляем товар
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



@app.route('/api/admin/albums', methods=['POST', 'PUT', 'DELETE'])
@jwt_required()
def admin_albums():
    current_user = get_jwt_identity()
    if not current_user['is_admin']:
        return jsonify({'message': 'Admin access required!'}), 403

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        data = request.get_json()
        
        if request.method == 'POST':
            # Валидация обязательных полей
            required_fields = ['artist_id', 'title', 'base_price', 'versions']
            if not all(field in data for field in required_fields):
                return jsonify({'message': 'Missing required fields'}), 400

            # Проверка существования артиста
            cur.execute('SELECT id FROM artists WHERE id = %s', (data['artist_id'],))
            if not cur.fetchone():
                return jsonify({'message': 'Artist not found'}), 404

            # Создание альбома
            cur.execute('''
                INSERT INTO albums (
                    artist_id, 
                    title, 
                    base_price,
                    description,
                    release_date,
                    status,
                    main_image_url,
                    is_preorder
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            ''', (
                data['artist_id'],
                data['title'],
                data['base_price'],
                data.get('description'),
                data.get('release_date'),
                data.get('status', 'in_stock'),
                data.get('main_image_url'),
                data.get('is_preorder', False)
            ))
            new_album = cur.fetchone()
            album_id = new_album['id']

            # Добавление версий альбома
            for version in data['versions']:
                version_fields = ['version_name', 'price_diff']
                if not all(field in version for field in version_fields):
                    conn.rollback()
                    return jsonify({'message': 'Missing required version fields'}), 400

                cur.execute('''
                    INSERT INTO album_versions (
                        album_id,
                        version_name,
                        price_diff,
                        packaging_details,
                        stock_quantity,
                        is_limited
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                ''', (
                    album_id,
                    version['version_name'],
                    version.get('price_diff', 0),
                    version.get('packaging_details'),
                    version.get('stock_quantity', 0),
                    version.get('is_limited', False)
                ))

            conn.commit()
            return jsonify(new_album), 201

        elif request.method == 'PUT':
            # Обновление альбома
            required_fields = ['id', 'title', 'base_price']
            if not all(field in data for field in required_fields):
                return jsonify({'message': 'Missing required fields'}), 400

            # Получаем текущий альбом
            cur.execute('SELECT * FROM albums WHERE id = %s', (data['id'],))
            album = cur.fetchone()
            if not album:
                return jsonify({'message': 'Album not found'}), 404

            # Обновление основных данных
            cur.execute('''
                UPDATE albums SET
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
                data['title'],
                data['base_price'],
                data.get('description'),
                data.get('release_date'),
                data.get('status', 'in_stock'),
                data.get('main_image_url'),
                data.get('is_preorder', False),
                data['id']
            ))
            updated_album = cur.fetchone()

            # Обновление версий
            if 'versions' in data:
                # Удаляем старые версии
                cur.execute('DELETE FROM album_versions WHERE album_id = %s', (data['id'],))
                
                # Добавляем новые версии
                for version in data['versions']:
                    cur.execute('''
                        INSERT INTO album_versions (
                            album_id,
                            version_name,
                            price_diff,
                            packaging_details,
                            stock_quantity,
                            is_limited
                        ) VALUES (%s, %s, %s, %s, %s, %s)
                    ''', (
                        data['id'],
                        version['version_name'],
                        version.get('price_diff', 0),
                        version.get('packaging_details'),
                        version.get('stock_quantity', 0),
                        version.get('is_limited', False)
                    ))

            conn.commit()
            return jsonify(updated_album)

        elif request.method == 'DELETE':
            album_id = data.get('id')
            if not album_id:
                return jsonify({'message': 'Album ID required'}), 400

            # Проверка существования альбома
            cur.execute('SELECT id FROM albums WHERE id = %s', (album_id,))
            if not cur.fetchone():
                return jsonify({'message': 'Album not found'}), 404

            # Каскадное удаление версий
            cur.execute('DELETE FROM album_versions WHERE album_id = %s', (album_id,))
            cur.execute('DELETE FROM albums WHERE id = %s RETURNING *', (album_id,))
            deleted_album = cur.fetchone()
            
            conn.commit()
            return jsonify(deleted_album) if deleted_album else ('', 204)

    except Exception as e:
        conn.rollback()
        return jsonify({'message': str(e)}), 500
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




@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

@app.after_request
def add_cors_headers(response):
    if request.referrer and 'localhost:3000' in request.referrer:
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

if __name__ == '__main__':
    app.run(debug=True)