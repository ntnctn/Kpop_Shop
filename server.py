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
    level=logging.DEBUG, # Уровень логирования
    format='%(asctime)s - %(levelname)s - %(message)s' # Формат сообщений
)

app.config['SECRET_KEY'] = 'your-secret-key-here' # Секретный ключ Flask
app.config['JWT_SECRET_KEY'] = 'your-jwt-secret-key' # Секретный ключ для JWT
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24) # Время жизни токена
jwt = JWTManager(app) # Инициализация JWT-менеджера

# Конфигурация базы данных PostgreSQL
DB_CONFIG = {
    'host': 'localhost',
    'database': 'kpop_shop',
    'user': 'postgres',
    'password': '12345',
    'port': '5432'
}

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG) # Создает и возвращает соединение с базой данных

# Универсальный обработчик CORS, добавляет CORS-заголовки ко всем ответам сервера.
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response

# Обработчики предварительных OPTIONS-запросов для CORS.
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


@app.route('/api/admin/users', methods=['OPTIONS'])
@app.route('/api/admin/users/<int:user_id>', methods=['OPTIONS'])
def handle_admin_users_options(user_id=None):
    return '', 200


@app.route('/api/admin/orders', methods=['OPTIONS'])
def handle_orders_options():
    response = make_response()
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response
@app.route('/api/admin/orders/<int:order_id>', methods=['OPTIONS'])
def handle_admin_orders_options(order_id=None):
    return '', 200

# =============================================================================================
# ============================== АУНТЕФИКАЦИЯ И ПОЛЬЗОВАТЕЛИ ==================================
# =============================================================================================



# Регистрация нового пользователя. Создает запись в БД, хеширует пароль, создает корзину.
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json() # Регистрирует нового пользователя и создает для него корзину
    app.logger.debug(f"Registration data: {data}")
    
    # Валидация входных данных
    
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'message': 'Email and password are required!'}), 400
    
    email = data['email']
    password = data['password']
    first_name = data.get('firstName') or data.get('first_name') or ''
    last_name = data.get('lastName') or data.get('last_name') or ''
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Проверка на существующего пользователя
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            return jsonify({'message': 'Email already exists!'}), 400
        
        hashed_password = generate_password_hash(password) # Хеширование пароля
        
        cur.execute(
            "INSERT INTO users (email, password_hash, first_name, last_name, is_admin) "
            "VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (email, hashed_password, first_name, last_name, False)
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        
        # Создание корзины для пользователя
        
        cur.execute("INSERT INTO cart (user_id) VALUES (%s) RETURNING id", (user_id,))
        cart_id = cur.fetchone()[0]
        conn.commit()
        
        return jsonify({
            'message': 'User created successfully!',
            'user_id': user_id,
            'cart_id': cart_id
        }), 201
        
    except Exception as e:
        conn.rollback() # Откат изменений при ошибке
        app.logger.error(f"Registration error: {str(e)}", exc_info=True)
        return jsonify({'message': 'Registration failed. Please try again.'}), 500
    finally:
        cur.close()
        conn.close()

# Аутентификация пользователя. Проверяет email и пароль, возвращает JWT-токен.
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

# Декоратор для проверки админских прав

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

# Проверяет валидность токена и возвращает информацию о пользователе.
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

# Возвращает профиль текущего пользователя.
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

# Просто проверяет валидность токена.
@app.route('/api/validate-token', methods=['GET'])
@jwt_required()
def validate_token():
    return jsonify({'valid': True}), 200



# =============================================================================================
# ==================================== ПУБЛИЧНЫЕ ==============================================
# =============================================================================================


# ---- АРТИСТЫ И АЛЬБОМЫ ---- 


# Список всех альбомов с версиями (кроме отсутствующих).
@app.route('/api/albums', methods=['GET'])
def get_albums(): # Возвращает список всех доступных альбомов с их версиями
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
     
      # Основной запрос альбомов
    cur.execute('''
        SELECT a.id, ar.name as artist, a.title, a.base_price, 
               a.main_image_url, a.status, a.release_date
        FROM albums a
        JOIN artists ar ON a.artist_id = ar.id
        WHERE a.status != 'out_of_stock'
        ORDER BY a.release_date DESC
    ''')
    albums = cur.fetchall()
    
    # Добавляем информацию о версиях для каждого альбома
    
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

# Детальная информация об альбоме.
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

# Список артистов по категории (female_group, male_group, solo).
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

# Список категорий артистов.
@app.route('/api/artist_categories', methods=['GET'])
def get_artist_categories():
    return jsonify([
        {'id': 'female_group', 'name': 'Женские группы'},
        {'id': 'male_group', 'name': 'Мужские группы'},
        {'id': 'solo', 'name': 'Сольные исполнители'}
    ])

# Информация об артисте и его альбомах.
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

# Альбомы артиста с пагинацией и сортировкой.
@app.route('/api/artists/<int:artist_id>/albums', methods=['GET'])
def get_artist_albums(artist_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Проверяем существование артиста
        cur.execute('SELECT id FROM artists WHERE id = %s', (artist_id,))
        if not cur.fetchone():
            return jsonify({'error': 'Artist not found'}), 404

        # Параметры запроса
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        sort = request.args.get('sort', 'release_date_desc')
        offset = (page - 1) * limit
        
        # Определяем сортировку
        order_by = {
            'release_date_desc': 'a.release_date DESC',
            'release_date_asc': 'a.release_date ASC',
            'price_asc': 'a.base_price ASC',
            'price_desc': 'a.base_price DESC',
            'title_asc': 'a.title ASC',
            'title_desc': 'a.title DESC'
        }.get(sort, 'a.release_date DESC')

        # Основной запрос
        cur.execute(f'''
            SELECT a.*, ar.name as artist_name
            FROM albums a
            JOIN artists ar ON a.artist_id = ar.id
            WHERE a.artist_id = %s
            ORDER BY {order_by}
            LIMIT %s OFFSET %s
        ''', (artist_id, limit, offset))
        albums = cur.fetchall()
        
        # Версии альбомов
        for album in albums:
            cur.execute('''
                SELECT id, version_name, price_diff, stock_quantity
                FROM album_versions
                WHERE album_id = %s
            ''', (album['id'],))
            album['versions'] = cur.fetchall()
        
        return jsonify({
            'albums': albums
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()



# ---- СКИДКИ ---- 


# Активные скидки для альбома       
@app.route('/api/albums/<int:album_id>/discounts', methods=['GET'])
def get_album_discounts(album_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Получаем активные скидки для альбома
        cur.execute('''
            SELECT d.* 
            FROM discounts d
            JOIN album_discounts ad ON d.id = ad.discount_id
            WHERE ad.album_id = %s 
            AND d.is_active = TRUE
            AND d.start_date <= NOW() 
            AND d.end_date >= NOW()
        ''', (album_id,))
        
        discounts = cur.fetchall()
        return jsonify(discounts)
        
    except Exception as e:
        app.logger.error(f"Get album discounts error: {str(e)}")
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()        
 

# ---- КОРЗИНА ----  
  

# Получить содержимое корзины текущего пользователя.| Добавить товар в корзину или увеличить количество.
@app.route('/api/cart', methods=['GET', 'POST'])
@jwt_required()
def cart_operations():
    # Получаем ID пользователя из JWT токена
    user_id = get_jwt_identity()  # Это будет строка или число, а не словарь
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Проверяем существование пользователя
        cur.execute('SELECT id FROM users WHERE id = %s', (user_id,))
        if not cur.fetchone():
            return jsonify({'message': 'User not found!'}), 404

        if request.method == 'GET':
            cur.execute('''
            SELECT 
                ci.id,
                ci.quantity,
                ci.cart_id,
                av.id AS version_id, 
                av.version_name,
                a.id AS album_id, 
                a.title AS album_title, 
                (a.base_price + av.price_diff) AS base_price,
                (a.base_price + av.price_diff) * (1 - COALESCE(d.discount_percent, 0) / 100.0) AS final_price,
                a.main_image_url,
                d.id AS discount_id,
                d.discount_percent,
                d.name AS discount_name
            FROM cart_items ci
            JOIN album_versions av ON ci.album_version_id = av.id
            JOIN albums a ON av.album_id = a.id
            JOIN cart c ON ci.cart_id = c.id
            LEFT JOIN album_discounts ad ON a.id = ad.album_id
            LEFT JOIN discounts d ON ad.discount_id = d.id 
                AND d.is_active = true 
                AND CURRENT_TIMESTAMP BETWEEN d.start_date AND d.end_date
            WHERE c.user_id = %s
        ''', (user_id,))
        
            items = cur.fetchall()
        
            # Рассчитываем итоги
            base_total = sum(float(item['base_price']) * int(item['quantity']) for item in items)
            final_total = sum(float(item['final_price']) * int(item['quantity']) for item in items)
        
            return jsonify({
                'items': items,
             'totals': {
                    'base_total': round(base_total, 2),
                  'final_total': round(final_total, 2),
                  'total_discount': round(base_total - final_total, 2)
                },
                'cart_id': items[0]['cart_id'] if items else None
            })

        elif request.method == 'POST':
            data = request.get_json()
            if not data or 'version_id' not in data:
                return jsonify({
                    'message': 'version_id is required',
                    'received_data': data
                }), 400

            # Получаем или создаем корзину
            cur.execute('SELECT id FROM cart WHERE user_id = %s', (user_id,))
            cart = cur.fetchone()
            
            if not cart:
                cur.execute('INSERT INTO cart (user_id) VALUES (%s) RETURNING id', (user_id,))
                cart_id = cur.fetchone()['id']
            else:
                cart_id = cart['id']
            
            # Проверяем, есть ли уже такой товар в корзине
            cur.execute('''
                SELECT id, quantity FROM cart_items 
                WHERE cart_id = %s AND album_version_id = %s
            ''', (cart_id, data['version_id']))
            existing_item = cur.fetchone()

            if existing_item:
                # Обновляем количество
                new_quantity = existing_item['quantity'] + data.get('quantity', 1)
                cur.execute('''
                    UPDATE cart_items 
                    SET quantity = %s 
                    WHERE id = %s
                ''', (new_quantity, existing_item['id']))
            else:
                # Добавляем новый товар
                cur.execute('''
                    INSERT INTO cart_items (cart_id, album_version_id, quantity)
                    VALUES (%s, %s, %s)
                ''', (cart_id, data['version_id'], data.get('quantity', 1)))
            
            conn.commit()
            return jsonify({'message': 'Item added to cart!'})

    except Exception as e:
        conn.rollback()
        app.logger.error(f"Cart operation error: {str(e)}")
        return jsonify({'message': str(e)}), 400
    finally:
        cur.close()
        conn.close()


# Удалить товар из корзины.
@app.route('/api/cart/<int:item_id>', methods=['DELETE'])
@jwt_required()
def remove_from_cart(item_id):
    user_id = get_jwt_identity()  # Получаем ID пользователя 
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)  
    
    try:
        # 1. Проверяем существование пользователя
        cur.execute('SELECT id FROM users WHERE id = %s', (user_id,))
        if not cur.fetchone():
            return jsonify({'message': 'User not found!'}), 404

        # 2. Удаляем товар только если он принадлежит текущему пользователю
        cur.execute('''
            DELETE FROM cart_items 
            WHERE id = %s AND cart_id IN (
                SELECT id FROM cart WHERE user_id = %s
            )
            RETURNING *
        ''', (item_id, user_id))
        
        deleted_item = cur.fetchone()
        
        if not deleted_item:
            return jsonify({
                'message': 'Item not found in your cart or already removed',
                'item_id': item_id,
                'user_id': user_id
            }), 404
            
        conn.commit()
        
        # 3. Возвращаем информацию об удаленном товаре
        return jsonify({
            'message': 'Item removed from cart successfully',
            'removed_item': deleted_item
        })

    except Exception as e:
        conn.rollback()
        app.logger.error(f"Error removing item {item_id} from cart: {str(e)}")
        return jsonify({
            'message': 'Failed to remove item from cart',
            'error': str(e),
            'item_id': item_id
        }), 400
        
    finally:
        cur.close()
        conn.close()
  

# ---- Оформление заказа ----

# Добавить содершимое корзины в заказ.
@app.route('/api/orders', methods=['POST'])
@jwt_required()
def create_order():
    user_id = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # 1. Получаем содержимое корзины с учетом скидок
        cur.execute('''
            SELECT 
                ci.quantity,
                av.id as version_id,
                av.version_name,
                (a.base_price + av.price_diff) as base_price,
                (a.base_price + av.price_diff) * (1 - COALESCE(d.discount_percent, 0)/100) as final_price,
                d.discount_percent
            FROM cart_items ci
            JOIN album_versions av ON ci.album_version_id = av.id
            JOIN albums a ON av.album_id = a.id
            JOIN cart c ON ci.cart_id = c.id
            LEFT JOIN album_discounts ad ON a.id = ad.album_id
            LEFT JOIN discounts d ON ad.discount_id = d.id 
                AND d.is_active = true 
                AND CURRENT_TIMESTAMP BETWEEN d.start_date AND d.end_date
            WHERE c.user_id = %s
        ''', (user_id,))
        
        cart_items = cur.fetchall()
        
        if not cart_items:
            return jsonify({'message': 'Cart is empty'}), 400

        # 2. Рассчитываем итоговую сумму со скидкой
        total_amount = sum(float(item['final_price']) * int(item['quantity']) for item in cart_items)

        # 3. Создаем заказ
        cur.execute('''
            INSERT INTO orders (user_id, total_amount, status)
            VALUES (%s, %s, 'created')
            RETURNING id
        ''', (user_id, total_amount))
        
        order_id = cur.fetchone()['id']

        # 4. Добавляем товары в заказ (фиксируем цену со скидкой)
        for item in cart_items:
            cur.execute('''
                INSERT INTO order_items (
                    order_id, 
                    album_version_id, 
                    quantity, 
                    price_per_unit,
                    version_name
                )
                VALUES (%s, %s, %s, %s, %s)
            ''', (
                order_id,
                item['version_id'],
                item['quantity'],
                item['final_price'],  # Записываем цену со скидкой
                item['version_name']
            ))

        # 5. Очищаем корзину
        cur.execute('''
            DELETE FROM cart_items 
            WHERE cart_id IN (SELECT id FROM cart WHERE user_id = %s)
        ''', (user_id,))
        
        conn.commit()

        return jsonify({
            'message': 'Order created successfully',
            'order_id': order_id,
            'total_amount': total_amount,
            'discount_applied': any(item['discount_percent'] for item in cart_items)
        }), 201

    except Exception as e:
        conn.rollback()
        app.logger.error(f"Create order error: {str(e)}")
        return jsonify({'message': str(e)}), 400
    finally:
        cur.close()
        conn.close()

# ---- История заказов ----

# Получить список заказов текущего пользователя
@app.route('/api/orders', methods=['GET'])
@jwt_required()
def get_user_orders():
    user_id = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Получаем параметры пагинации
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        offset = (page - 1) * per_page
        
        # Основной запрос заказов пользователя
        cur.execute('''
            SELECT o.*
            FROM orders o
            WHERE o.user_id = %s
            ORDER BY o.created_at DESC
            LIMIT %s OFFSET %s
        ''', (user_id, per_page, offset))
        orders = cur.fetchall()
        
        # Получаем товары для каждого заказа
        for order in orders:
            cur.execute('''
                SELECT 
                    oi.*, 
                    av.version_name,
                    a.title as album_title, 
                    a.main_image_url,
                    ar.name as artist_name
                FROM order_items oi
                JOIN album_versions av ON oi.album_version_id = av.id
                JOIN albums a ON av.album_id = a.id
                JOIN artists ar ON a.artist_id = ar.id
                WHERE oi.order_id = %s
            ''', (order['id'],))
            order['items'] = cur.fetchall()
        
        # Получаем общее количество заказов пользователя
        cur.execute('SELECT COUNT(*) FROM orders WHERE user_id = %s', (user_id,))
        total_orders = cur.fetchone()['count']
        
        return jsonify({
            'orders': orders,
            'total': total_orders,
            'page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        app.logger.error(f"Get user orders error: {str(e)}")
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()

# Получить детальную информацию о заказе пользователя
@app.route('/api/orders/<int:order_id>', methods=['GET'])
@jwt_required()
def get_user_order(order_id):
    user_id = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Проверяем, что заказ принадлежит пользователю
        cur.execute('''
            SELECT o.*
            FROM orders o
            WHERE o.id = %s AND o.user_id = %s
        ''', (order_id, user_id))
        order = cur.fetchone()
        
        if not order:
            return jsonify({'message': 'Order not found or access denied'}), 404
        
        # Получаем товары в заказе
        cur.execute('''
            SELECT 
                oi.*, 
                av.version_name,
                a.title as album_title, 
                a.main_image_url,
                ar.name as artist_name
            FROM order_items oi
            JOIN album_versions av ON oi.album_version_id = av.id
            JOIN albums a ON av.album_id = a.id
            JOIN artists ar ON a.artist_id = ar.id
            WHERE oi.order_id = %s
        ''', (order_id,))
        order['items'] = cur.fetchall()
        
        return jsonify(order)
        
    except Exception as e:
        app.logger.error(f"Get user order error: {str(e)}")
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()
        
        
        
# =============================================================================================
# ==================================== АДМИНСКИЕ ==============================================
# =============================================================================================



# ---- АРТИСТЫ ----


# Список всех артистов. | Создать нового артиста.
@app.route('/api/admin/artists', methods=['GET', 'POST'])
@jwt_required()
@admin_required
def admin_artists(): # Управление артистами: GET - список, POST - создание
    current_user = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if request.method == 'GET':
            # Получение списка всех артистов
            cur.execute('SELECT * FROM artists')
            artists = cur.fetchall()
            return jsonify(artists)
        
        elif request.method == 'POST':
            # Создание нового артиста
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

# Получить артиста по ID. | Обновить артиста.
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

# Удалить артиста и все его альбомы.
@app.route('/api/admin/artists/<int:id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_artist(id):
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Сначала удаляем все альбомы артиста (и их версии)
        cur.execute('SELECT id FROM albums WHERE artist_id = %s', (id,))
        album_ids = [row[0] for row in cur.fetchall()]
        
        for album_id in album_ids:
            cur.execute('DELETE FROM album_versions WHERE album_id = %s', (album_id,))
        
        cur.execute('DELETE FROM albums WHERE artist_id = %s', (id,))
        
        # Затем удаляем самого артиста
        cur.execute('DELETE FROM artists WHERE id = %s RETURNING id', (id,))
        deleted = cur.fetchone()
        
        if not deleted:
            conn.rollback()
            return jsonify({'message': 'Artist not found'}), 404
            
        conn.commit()
        return jsonify({'message': 'Artist and all related albums deleted successfully'}), 200
        
    except Exception as e:
        conn.rollback()
        app.logger.error(f"Delete artist error: {str(e)}")
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()


# ---- АЛЬБОМЫ ----


# Список всех альбомов с версиями. | Создать новый альбом с версиями.
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
        

# Получить альбом по ID. | Обновить альбом и его версии.
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


# Удалить альбом и все его версии.
@app.route('/api/admin/albums/<int:id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_album(id):
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Удаляем все версии альбома
        cur.execute('DELETE FROM album_versions WHERE album_id = %s', (id,))
        
        # Удаляем сам альбом
        cur.execute('DELETE FROM albums WHERE id = %s RETURNING id', (id,))
        deleted = cur.fetchone()
        
        if not deleted:
            conn.rollback()
            return jsonify({'message': 'Album not found'}), 404
            
        conn.commit()
        return jsonify({'message': 'Album and all versions deleted successfully'}), 200
        
    except Exception as e:
        conn.rollback()
        app.logger.error(f"Delete album error: {str(e)}")
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()
   
    
# ---- СКИДКИ ----


# Список всех скидок | Создать новую скидку
@app.route('/api/admin/discounts', methods=['GET', 'POST'])
@jwt_required()
@admin_required
def admin_discounts():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if request.method == 'GET':
            cur.execute('SELECT * FROM discounts')
            discounts = cur.fetchall()
            return jsonify(discounts)
        
        elif request.method == 'POST':
            data = request.get_json()
            required_fields = ['name', 'discount_percent', 'start_date', 'end_date']
            if not all(field in data for field in required_fields):
                return jsonify({'message': 'Missing required fields'}), 400
            
            cur.execute(
                "INSERT INTO discounts (name, description, discount_percent, start_date, end_date, is_active) "
                "VALUES (%s, %s, %s, %s, %s, %s) RETURNING *",
                (data['name'], data.get('description'), data['discount_percent'],
                data['start_date'], data['end_date'], data.get('is_active', True)))
            new_discount = cur.fetchone()
            conn.commit()
            
            return jsonify(new_discount), 201
            
    except Exception as e:
        conn.rollback()
        app.logger.error(f"Admin discounts error: {str(e)}")
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()

# Обновить скидку | Удалить скидку
@app.route('/api/admin/discounts/<int:id>', methods=['PUT', 'DELETE'])
@jwt_required()
@admin_required
def admin_discount(id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if request.method == 'PUT':
            data = request.get_json()
            required_fields = ['name', 'discount_percent', 'start_date', 'end_date']
            if not all(field in data for field in required_fields):
                return jsonify({'message': 'Missing required fields'}), 400
            
            cur.execute(
                "UPDATE discounts SET name = %s, description = %s, discount_percent = %s, "
                "start_date = %s, end_date = %s, is_active = %s "
                "WHERE id = %s RETURNING *",
                (data['name'], data.get('description'), data['discount_percent'],
                data['start_date'], data['end_date'], data.get('is_active', True), id))
            updated_discount = cur.fetchone()
            
            if not updated_discount:
                return jsonify({'message': 'Discount not found'}), 404
                
            conn.commit()
            return jsonify(updated_discount)
            
        elif request.method == 'DELETE':
            # Сначала удаляем связи с альбомами
            cur.execute('DELETE FROM album_discounts WHERE discount_id = %s', (id,))
            
            # Затем удаляем саму скидку
            cur.execute('DELETE FROM discounts WHERE id = %s RETURNING id', (id,))
            deleted = cur.fetchone()
            
            if not deleted:
                return jsonify({'message': 'Discount not found'}), 404
                
            conn.commit()
            return jsonify({'message': 'Discount deleted successfully'}), 200
            
    except Exception as e:
        conn.rollback()
        app.logger.error(f"Admin discount error: {str(e)}")
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()

# Альбомы с данной скидкой | Добавить альбом к скидке
@app.route('/api/admin/discounts/<int:discount_id>/albums', methods=['GET', 'POST'])
@jwt_required()
@admin_required
def discount_albums(discount_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if request.method == 'GET':
            cur.execute('''
                SELECT a.*, ar.name as artist_name 
                FROM albums a
                JOIN artists ar ON a.artist_id = ar.id
                JOIN album_discounts ad ON a.id = ad.album_id
                WHERE ad.discount_id = %s
            ''', (discount_id,))
            albums = cur.fetchall()
            return jsonify(albums)
            
        elif request.method == 'POST':
            data = request.get_json()
            if not data or 'album_id' not in data:
                return jsonify({'message': 'Album ID is required'}), 400
                
            # Проверяем существование альбома
            cur.execute('SELECT id FROM albums WHERE id = %s', (data['album_id'],))
            if not cur.fetchone():
                return jsonify({'message': 'Album not found'}), 404
                
            # Проверяем, нет ли уже такой связи
            cur.execute('''
                SELECT * FROM album_discounts 
                WHERE discount_id = %s AND album_id = %s
            ''', (discount_id, data['album_id']))
            if cur.fetchone():
                return jsonify({'message': 'Album already in discount'}), 400
                
            # Добавляем связь
            cur.execute('''
                INSERT INTO album_discounts (discount_id, album_id)
                VALUES (%s, %s)
            ''', (discount_id, data['album_id']))
            
            conn.commit()
            return jsonify({'message': 'Album added to discount'}), 201
            
    except Exception as e:
        conn.rollback()
        app.logger.error(f"Discount albums error: {str(e)}")
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()

# Удалить альбом из скидки
@app.route('/api/admin/discounts/<int:discount_id>/albums/<int:album_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def remove_album_from_discount(discount_id, album_id):
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute('''
            DELETE FROM album_discounts 
            WHERE discount_id = %s AND album_id = %s
            RETURNING *
        ''', (discount_id, album_id))
        
        if not cur.fetchone():
            return jsonify({'message': 'Album not found in discount'}), 404
            
        conn.commit()
        return jsonify({'message': 'Album removed from discount'}), 200
        
    except Exception as e:
        conn.rollback()
        app.logger.error(f"Remove album from discount error: {str(e)}")
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()
    
       
        
# =============================================================================================
# ============================== АДМИНСКОЕ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ==============================
# =============================================================================================

# Получить список всех пользователей
@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
@admin_required
def get_all_users():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Получаем параметры пагинации из запроса
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        offset = (page - 1) * per_page
        
        # Основной запрос пользователей
        cur.execute('''
            SELECT id, email, first_name, last_name, is_admin, is_active, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        ''', (per_page, offset))
        users = cur.fetchall()
        
        # Получаем общее количество пользователей для пагинации
        cur.execute('SELECT COUNT(*) FROM users')
        total_users = cur.fetchone()['count']
        
        return jsonify({
            'users': users,
            'total': total_users,
            'page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        app.logger.error(f"Get all users error: {str(e)}")
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()

# Получить информацию о конкретном пользователе
@app.route('/api/admin/users/<int:user_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_user(user_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute('''
            SELECT id, email, first_name, last_name, is_admin, is_active, created_at
            FROM users
            WHERE id = %s
        ''', (user_id,))
        user = cur.fetchone()
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        return jsonify(user)
        
    except Exception as e:
        app.logger.error(f"Get user error: {str(e)}")
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()

# Обновить информацию о пользователе
@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_user(user_id):
    data = request.get_json()
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Проверяем существование пользователя
        cur.execute('SELECT id FROM users WHERE id = %s', (user_id,))
        if not cur.fetchone():
            return jsonify({'message': 'User not found'}), 404
        
        # Обновляем только те поля, которые были переданы
        update_fields = []
        update_values = []
        
        if 'email' in data:
            update_fields.append("email = %s")
            update_values.append(data['email'])
            
        if 'first_name' in data:
            update_fields.append("first_name = %s")
            update_values.append(data['first_name'])
            
        if 'last_name' in data:
            update_fields.append("last_name = %s")
            update_values.append(data['last_name'])
            
        if 'is_admin' in data:
            update_fields.append("is_admin = %s")
            update_values.append(data['is_admin'])
            
        if 'is_active' in data:
            update_fields.append("is_active = %s")
            update_values.append(data['is_active'])
            
        if 'password' in data and data['password']:
            hashed_password = generate_password_hash(data['password'])
            update_fields.append("password_hash = %s")
            update_values.append(hashed_password)
        
        if not update_fields:
            return jsonify({'message': 'No fields to update'}), 400
            
        update_values.append(user_id)
        
        update_query = f'''
            UPDATE users 
            SET {', '.join(update_fields)}
            WHERE id = %s
            RETURNING id, email, first_name, last_name, is_admin, is_active
        '''
        
        cur.execute(update_query, update_values)
        updated_user = cur.fetchone()
        conn.commit()
        
        return jsonify(updated_user)
        
    except Exception as e:
        conn.rollback()
        app.logger.error(f"Update user error: {str(e)}")
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()

# Удалить пользователя
@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(user_id):
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Проверяем существование пользователя
        cur.execute('SELECT id FROM users WHERE id = %s', (user_id,))
        if not cur.fetchone():
            return jsonify({'message': 'User not found'}), 404
        
        # Сначала удаляем связанные данные (корзину, заказы и т.д.)
        # Удаляем корзину пользователя и ее содержимое
        cur.execute('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM cart WHERE user_id = %s)', (user_id,))
        cur.execute('DELETE FROM cart WHERE user_id = %s', (user_id,))
        
        # Удаляем адреса пользователя
        cur.execute('DELETE FROM user_addresses WHERE user_id = %s', (user_id,))
        
        # Удаляем вишлист пользователя
        cur.execute('DELETE FROM wishlist WHERE user_id = %s', (user_id,))
        
        # Затем удаляем самого пользователя
        cur.execute('DELETE FROM users WHERE id = %s RETURNING id', (user_id,))
        deleted = cur.fetchone()
        conn.commit()
        
        if not deleted:
            return jsonify({'message': 'User not found'}), 404
            
        return jsonify({'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        conn.rollback()
        app.logger.error(f"Delete user error: {str(e)}")
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()  
    

# =============================================================================================
# ============================== АДМИНСКОЕ ДЛЯ ЗАКАЗОВ ====================================
# =============================================================================================

# Получить список всех заказов с товарами
@app.route('/api/admin/orders', methods=['GET'])
@jwt_required()
@admin_required
def get_all_orders():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Получаем параметры пагинации
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        offset = (page - 1) * per_page
        
        # Основной запрос заказов
        cur.execute('''
    SELECT o.*, u.email as user_email, 
           CONCAT(u.first_name, ' ', u.last_name) as user_full_name
    FROM orders o
    JOIN users u ON o.user_id = u.id
    LEFT JOIN user_addresses ua ON o.address_id = ua.id
    ORDER BY o.created_at DESC
    LIMIT %s OFFSET %s
''', (per_page, offset))
        orders = cur.fetchall()
        
        # Получаем товары для каждого заказа
        for order in orders:
            cur.execute('''
                SELECT oi.*, av.version_name as current_version_name,
                       a.title as album_title, ar.name as artist_name
                FROM order_items oi
                JOIN album_versions av ON oi.album_version_id = av.id
                JOIN albums a ON av.album_id = a.id
                JOIN artists ar ON a.artist_id = ar.id
                WHERE oi.order_id = %s
            ''', (order['id'],))
            order['items'] = cur.fetchall()
        
        # Получаем общее количество заказов
        cur.execute('SELECT COUNT(*) FROM orders')
        total_orders = cur.fetchone()['count']
        
        return jsonify({
            'orders': orders,
            'total': total_orders,
            'page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        app.logger.error(f"Get all orders error: {str(e)}")
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()

# Получить детальную информацию о заказе
@app.route('/api/admin/orders/<int:order_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_order(order_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Получаем основную информацию о заказе
        cur.execute('''
    SELECT o.*, u.email as user_email, 
           CONCAT(u.first_name, ' ', u.last_name) as user_full_name,
           ua.country, ua.city, ua.postal_code, ua.street, 
           ua.house, ua.apartment
    FROM orders o
    JOIN users u ON o.user_id = u.id
    LEFT JOIN user_addresses ua ON o.address_id = ua.id
    WHERE o.id = %s
''', (order_id,))
        order = cur.fetchone()
        
        if not order:
            return jsonify({'message': 'Order not found'}), 404
        
        # Получаем товары в заказе
        cur.execute('''
            SELECT oi.*, av.version_name as current_version_name,
                   a.title as album_title, a.main_image_url,
                   ar.name as artist_name
            FROM order_items oi
            JOIN album_versions av ON oi.album_version_id = av.id
            JOIN albums a ON av.album_id = a.id
            JOIN artists ar ON a.artist_id = ar.id
            WHERE oi.order_id = %s
        ''', (order_id,))
        order['items'] = cur.fetchall()
        
        return jsonify(order)
        
    except Exception as e:
        app.logger.error(f"Get order error: {str(e)}")
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()

# Обновить статус заказа
@app.route('/api/admin/orders/<int:order_id>/status', methods=['PUT'])
@jwt_required()
@admin_required
def update_order_status(order_id):
    data = request.get_json()
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    if not data or 'status' not in data:
        return jsonify({'message': 'Status is required'}), 400
    
    valid_statuses = ['created', 'paid', 'shipped', 'delivered', 'cancelled']
    if data['status'] not in valid_statuses:
        return jsonify({'message': 'Invalid status'}), 400
    
    try:
        # Проверяем существование заказа
        cur.execute('SELECT id, status FROM orders WHERE id = %s', (order_id,))
        order = cur.fetchone()
        if not order:
            return jsonify({'message': 'Order not found'}), 404
        
        # Подготовка данных для обновления
        update_fields = ["status = %s"]
        update_values = [data['status']]
        
        # Если статус меняется на paid, устанавливаем paid_at
        if data['status'] == 'paid' and order['status'] != 'paid':
            update_fields.append("paid_at = NOW()")
        
        # Если добавляется tracking_number
        if 'tracking_number' in data:
            update_fields.append("tracking_number = %s")
            update_values.append(data['tracking_number'])
        
        update_values.append(order_id)
        
        # Выполняем обновление
        update_query = f'''
            UPDATE orders 
            SET {', '.join(update_fields)}
            WHERE id = %s
            RETURNING *
        '''
        
        cur.execute(update_query, update_values)
        updated_order = cur.fetchone()
        conn.commit()
        
        return jsonify(updated_order)
        
    except Exception as e:
        conn.rollback()
        app.logger.error(f"Update order status error: {str(e)}")
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()

# Удалить заказ
@app.route('/api/admin/orders/<int:order_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_order(order_id):
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Сначала удаляем товары заказа
        cur.execute('DELETE FROM order_items WHERE order_id = %s', (order_id,))
        
        # Затем удаляем сам заказ
        cur.execute('DELETE FROM orders WHERE id = %s RETURNING id', (order_id,))
        deleted = cur.fetchone()
        conn.commit()
        
        if not deleted:
            return jsonify({'message': 'Order not found'}), 404
            
        return jsonify({'message': 'Order deleted successfully'}), 200
        
    except Exception as e:
        conn.rollback()
        app.logger.error(f"Delete order error: {str(e)}")
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()



# =============================================================================================
# ===================================== ПРОФИЛЬ ===============================================
# =============================================================================================

@app.route('/api/profile', methods=['GET', 'PUT'])
@jwt_required()
def user_profile():
    current_user = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if request.method == 'GET':
            # Получаем данные пользователя
            cur.execute('''
                SELECT id, email, first_name, last_name, created_at
                FROM users
                WHERE id = %s
            ''', (current_user['id'],))
            user = cur.fetchone()
            
            if not user:
                return jsonify({'message': 'User not found'}), 404
            
            # Получаем адреса пользователя
            cur.execute('''
                SELECT * FROM user_addresses
                WHERE user_id = %s
            ''', (current_user['id'],))
            addresses = cur.fetchall()
            
            # Получаем заказы пользователя
            cur.execute('''
                SELECT o.id, o.total_amount, o.status, o.created_at,
                       ua.country, ua.city, ua.postal_code
                FROM orders o
                LEFT JOIN user_addresses ua ON o.address_id = ua.id
                WHERE o.user_id = %s
                ORDER BY o.created_at DESC
                LIMIT 5
            ''', (current_user['id'],))
            orders = cur.fetchall()
            
            # Получаем избранное
            cur.execute('''
                SELECT w.id, a.id as album_id, a.title, a.main_image_url,
                       ar.name as artist_name
                FROM wishlist w
                JOIN albums a ON w.album_id = a.id
                JOIN artists ar ON a.artist_id = ar.id
                WHERE w.user_id = %s
                LIMIT 5
            ''', (current_user['id'],))
            wishlist = cur.fetchall()
            
            return jsonify({
                'user': user,
                'addresses': addresses,
                'recent_orders': orders,
                'wishlist': wishlist
            })
            
        elif request.method == 'PUT':
            data = request.get_json()
            if not data:
                return jsonify({'message': 'No data provided'}), 400
                
            update_fields = []
            update_values = []
            
            if 'first_name' in data:
                update_fields.append("first_name = %s")
                update_values.append(data['first_name'])
                
            if 'last_name' in data:
                update_fields.append("last_name = %s")
                update_values.append(data['last_name'])
                
            if 'email' in data:
                update_fields.append("email = %s")
                update_values.append(data['email'])
                
            if 'password' in data and data['password']:
                hashed_password = generate_password_hash(data['password'])
                update_fields.append("password_hash = %s")
                update_values.append(hashed_password)
                
            if not update_fields:
                return jsonify({'message': 'Nothing to update'}), 400
                
            update_values.append(current_user['id'])
            
            update_query = f'''
                UPDATE users SET
                {', '.join(update_fields)}
                WHERE id = %s
                RETURNING id, email, first_name, last_name
            '''
            
            cur.execute(update_query, update_values)
            updated_user = cur.fetchone()
            conn.commit()
            
            if not updated_user:
                return jsonify({'message': 'User not found'}), 404
                
            return jsonify(updated_user)
            
    except Exception as e:
        conn.rollback()
        app.logger.error(f"Profile error: {str(e)}")
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()

# =============================================================================================
# ===================================== АДРЕСА ================================================
# =============================================================================================

@app.route('/api/addresses', methods=['GET', 'POST'])
@jwt_required()
def user_addresses():
    current_user = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if request.method == 'GET':
            cur.execute('''
                SELECT * FROM user_addresses
                WHERE user_id = %s
                ORDER BY is_default DESC
            ''', (current_user['id'],))
            addresses = cur.fetchall()
            return jsonify(addresses)
            
        elif request.method == 'POST':
            data = request.get_json()
            required_fields = ['country', 'city', 'postal_code', 'street', 'house']
            if not all(field in data for field in required_fields):
                return jsonify({'message': 'Missing required fields'}), 400
                
            # Если это первый адрес, делаем его адресом по умолчанию
            cur.execute('SELECT COUNT(*) FROM user_addresses WHERE user_id = %s', (current_user['id'],))
            count = cur.fetchone()['count']
            is_default = count == 0
            
            cur.execute('''
                INSERT INTO user_addresses (
                    user_id, country, city, postal_code, 
                    street, house, apartment, is_default
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            ''', (
                current_user['id'],
                data['country'],
                data['city'],
                data['postal_code'],
                data['street'],
                data['house'],
                data.get('apartment', ''),
                is_default
            ))
            new_address = cur.fetchone()
            conn.commit()
            return jsonify(new_address), 201
            
    except Exception as e:
        conn.rollback()
        app.logger.error(f"Addresses error: {str(e)}")
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/addresses/<int:address_id>', methods=['PUT', 'DELETE', 'PATCH'])
@jwt_required()
def user_address(address_id):
    current_user = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Проверяем, что адрес принадлежит пользователю
        cur.execute('''
            SELECT id FROM user_addresses
            WHERE id = %s AND user_id = %s
        ''', (address_id, current_user['id']))
        if not cur.fetchone():
            return jsonify({'message': 'Address not found'}), 404
            
        if request.method == 'PUT':
            data = request.get_json()
            required_fields = ['country', 'city', 'postal_code', 'street', 'house']
            if not all(field in data for field in required_fields):
                return jsonify({'message': 'Missing required fields'}), 400
                
            cur.execute('''
                UPDATE user_addresses SET
                    country = %s,
                    city = %s,
                    postal_code = %s,
                    street = %s,
                    house = %s,
                    apartment = %s
                WHERE id = %s
                RETURNING *
            ''', (
                data['country'],
                data['city'],
                data['postal_code'],
                data['street'],
                data['house'],
                data.get('apartment', ''),
                address_id
            ))
            updated_address = cur.fetchone()
            conn.commit()
            return jsonify(updated_address)
            
        elif request.method == 'DELETE':
            # Проверяем, не является ли адрес адресом по умолчанию
            cur.execute('SELECT is_default FROM user_addresses WHERE id = %s', (address_id,))
            if cur.fetchone()['is_default']:
                return jsonify({'message': 'Cannot delete default address'}), 400
                
            cur.execute('DELETE FROM user_addresses WHERE id = %s RETURNING id', (address_id,))
            if not cur.fetchone():
                return jsonify({'message': 'Address not found'}), 404
                
            conn.commit()
            return jsonify({'message': 'Address deleted successfully'}), 200
            
        elif request.method == 'PATCH':
            # Установка адреса по умолчанию
            cur.execute('''
                UPDATE user_addresses 
                SET is_default = CASE 
                    WHEN id = %s THEN TRUE
                    ELSE FALSE
                END
                WHERE user_id = %s
                RETURNING *
            ''', (address_id, current_user['id']))
            updated_addresses = cur.fetchall()
            conn.commit()
            
            # Находим новый адрес по умолчанию
            default_address = next((addr for addr in updated_addresses if addr['is_default']), None)
            return jsonify(default_address)
            
    except Exception as e:
        conn.rollback()
        app.logger.error(f"Address error: {str(e)}")
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()

# =============================================================================================
# ===================================== ИЗБРАННОЕ =============================================
# =============================================================================================

@app.route('/api/wishlist', methods=['GET', 'POST', 'DELETE'])
@jwt_required()
def wishlist():
    current_user = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if request.method == 'GET':
            # Получаем избранное пользователя
            cur.execute('''
                SELECT w.id, a.id as album_id, a.title, a.main_image_url,
                       ar.name as artist_name, a.base_price
                FROM wishlist w
                JOIN albums a ON w.album_id = a.id
                JOIN artists ar ON a.artist_id = ar.id
                WHERE w.user_id = %s
            ''', (current_user['id'],))
            wishlist_items = cur.fetchall()
            return jsonify(wishlist_items)
            
        elif request.method == 'POST':
            # Добавляем альбом в избранное
            data = request.get_json()
            if not data or 'album_id' not in data:
                return jsonify({'message': 'Album ID is required'}), 400
                
            # Проверяем, есть ли уже этот альбом в избранном
            cur.execute('''
                SELECT id FROM wishlist
                WHERE user_id = %s AND album_id = %s
            ''', (current_user['id'], data['album_id']))
            if cur.fetchone():
                return jsonify({'message': 'Album already in wishlist'}), 400
                
            cur.execute('''
                INSERT INTO wishlist (user_id, album_id)
                VALUES (%s, %s)
                RETURNING id
            ''', (current_user['id'], data['album_id']))
            new_item = cur.fetchone()
            conn.commit()
            
            # Возвращаем информацию о добавленном альбоме
            cur.execute('''
                SELECT a.id, a.title, a.main_image_url, ar.name as artist_name
                FROM albums a
                JOIN artists ar ON a.artist_id = ar.id
                WHERE a.id = %s
            ''', (data['album_id'],))
            album = cur.fetchone()
            
            return jsonify({
                'id': new_item['id'],
                'album': album
            }), 201
            
        elif request.method == 'DELETE':
            # Удаляем альбом из избранного
            data = request.get_json()
            if not data or 'album_id' not in data:
                return jsonify({'message': 'Album ID is required'}), 400
                
            cur.execute('''
                DELETE FROM wishlist
                WHERE user_id = %s AND album_id = %s
                RETURNING id
            ''', (current_user['id'], data['album_id']))
            if not cur.fetchone():
                return jsonify({'message': 'Album not found in wishlist'}), 404
                
            conn.commit()
            return jsonify({'message': 'Album removed from wishlist'}), 200
            
    except Exception as e:
        conn.rollback()
        app.logger.error(f"Wishlist error: {str(e)}")
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()
      
if __name__ == '__main__':
    app.run(debug=True)
    
