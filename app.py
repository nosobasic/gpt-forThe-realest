"""
Flask Backend API for ChatGPT Clone
Handles OpenAI API communication, conversations, and memories
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

openai_api_key = os.getenv('OPENAI_API_KEY')
client = OpenAI(api_key=openai_api_key) if openai_api_key else None

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)

def init_db():
    """Create database tables if they don't exist"""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(255) PRIMARY KEY,
                    email VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) REFERENCES users(id),
                    title VARCHAR(255) DEFAULT 'New Chat',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
                    role VARCHAR(50) NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS memories (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) REFERENCES users(id),
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
    print("Database tables initialized")

# Initialize database tables on module load (works with gunicorn)
try:
    init_db()
except Exception as e:
    print(f"Database initialization error: {e}")

def ensure_user(user_id, email=None):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO users (id, email) VALUES (%s, %s) ON CONFLICT (id) DO UPDATE SET email = COALESCE(%s, users.email)",
                (user_id, email, email)
            )
            conn.commit()

@app.route('/')
def health_check():
    return jsonify({"status": "ok", "message": "Backend is running"})

# ============ CONVERSATIONS ============

@app.route('/api/conversations', methods=['GET'])
def list_conversations():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Missing X-User-Id header"}), 401
    
    ensure_user(user_id)
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, title, created_at, updated_at FROM conversations WHERE user_id = %s ORDER BY updated_at DESC",
                (user_id,)
            )
            conversations = cur.fetchall()
    return jsonify(conversations)

@app.route('/api/conversations', methods=['POST'])
def create_conversation():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Missing X-User-Id header"}), 401
    
    try:
        ensure_user(user_id)
        data = request.get_json(silent=True) or {}
        title = data.get('title', 'New Chat')
        
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO conversations (user_id, title) VALUES (%s, %s) RETURNING id, title, created_at, updated_at",
                    (user_id, title)
                )
                conversation = cur.fetchone()
                conn.commit()
        return jsonify(conversation), 201
    except Exception as e:
        print(f"Error creating conversation: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/conversations/<int:conv_id>', methods=['GET'])
def get_conversation(conv_id):
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Missing X-User-Id header"}), 401
    
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, title, created_at, updated_at FROM conversations WHERE id = %s AND user_id = %s",
                (conv_id, user_id)
            )
            conversation = cur.fetchone()
            if not conversation:
                return jsonify({"error": "Conversation not found"}), 404
            
            cur.execute(
                "SELECT id, role, content, created_at FROM messages WHERE conversation_id = %s ORDER BY created_at ASC",
                (conv_id,)
            )
            messages = cur.fetchall()
    
    return jsonify({**conversation, "messages": messages})

@app.route('/api/conversations/<int:conv_id>', methods=['PUT'])
def update_conversation(conv_id):
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Missing X-User-Id header"}), 401
    
    data = request.get_json() or {}
    title = data.get('title')
    
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE conversations SET title = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s AND user_id = %s RETURNING id, title, created_at, updated_at",
                (title, conv_id, user_id)
            )
            conversation = cur.fetchone()
            conn.commit()
            if not conversation:
                return jsonify({"error": "Conversation not found"}), 404
    
    return jsonify(conversation)

@app.route('/api/conversations/<int:conv_id>', methods=['DELETE'])
def delete_conversation(conv_id):
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Missing X-User-Id header"}), 401
    
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM conversations WHERE id = %s AND user_id = %s",
                (conv_id, user_id)
            )
            conn.commit()
            if cur.rowcount == 0:
                return jsonify({"error": "Conversation not found"}), 404
    
    return jsonify({"success": True})

# ============ CHAT ============

@app.route('/api/conversations/<int:conv_id>/chat', methods=['POST'])
def chat_in_conversation(conv_id):
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Missing X-User-Id header"}), 401
    
    if not client:
        return jsonify({"error": {"message": "OPENAI_API_KEY not set"}}), 500
    
    data = request.get_json()
    if not data or 'content' not in data:
        return jsonify({"error": {"message": "Missing 'content' field"}}), 400
    
    user_content = data['content']
    
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM conversations WHERE id = %s AND user_id = %s", (conv_id, user_id))
            if not cur.fetchone():
                return jsonify({"error": "Conversation not found"}), 404
            
            cur.execute("INSERT INTO messages (conversation_id, role, content) VALUES (%s, 'user', %s)", (conv_id, user_content))
            
            cur.execute("SELECT role, content FROM messages WHERE conversation_id = %s ORDER BY created_at ASC", (conv_id,))
            messages = [{"role": m["role"], "content": m["content"]} for m in cur.fetchall()]
            
            cur.execute("SELECT content FROM memories WHERE user_id = %s", (user_id,))
            memories = [m["content"] for m in cur.fetchall()]
            
            system_message = "You are a helpful AI assistant."
            if memories:
                system_message += "\n\nHere are some things you know about the user:\n" + "\n".join(f"- {m}" for m in memories)
            
            api_messages = [{"role": "system", "content": system_message}] + messages
            
            try:
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=api_messages,
                    temperature=0.7
                )
                assistant_content = response.choices[0].message.content
            except Exception as e:
                return jsonify({"error": {"message": str(e)}}), 500
            
            cur.execute("INSERT INTO messages (conversation_id, role, content) VALUES (%s, 'assistant', %s)", (conv_id, assistant_content))
            
            if len(messages) == 1:
                title = user_content[:50] + ("..." if len(user_content) > 50 else "")
                cur.execute("UPDATE conversations SET title = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s", (title, conv_id))
            else:
                cur.execute("UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = %s", (conv_id,))
            
            conn.commit()
            
            extract_memories(user_id, user_content, assistant_content, memories)
    
    return jsonify({"response": assistant_content, "message": assistant_content})

@app.route('/api/conversations/<int:conv_id>/chat/stream', methods=['POST'])
def chat_in_conversation_stream(conv_id):
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Missing X-User-Id header"}), 401
    
    if not client:
        return jsonify({"error": {"message": "OPENAI_API_KEY not set"}}), 500
    
    data = request.get_json()
    if not data or 'content' not in data:
        return jsonify({"error": {"message": "Missing 'content' field"}}), 400
    
    user_content = data['content']
    attachments = data.get('attachments', [])
    
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM conversations WHERE id = %s AND user_id = %s", (conv_id, user_id))
            if not cur.fetchone():
                return jsonify({"error": "Conversation not found"}), 404
            
            cur.execute("INSERT INTO messages (conversation_id, role, content) VALUES (%s, 'user', %s)", (conv_id, user_content))
            
            cur.execute("SELECT role, content FROM messages WHERE conversation_id = %s ORDER BY created_at ASC", (conv_id,))
            messages = [{"role": m["role"], "content": m["content"]} for m in cur.fetchall()]
            
            cur.execute("SELECT content FROM memories WHERE user_id = %s", (user_id,))
            memories = [m["content"] for m in cur.fetchall()]
            
            conn.commit()
    
    system_message = "You are a helpful AI assistant."
    if memories:
        system_message += "\n\nHere are some things you know about the user:\n" + "\n".join(f"- {m}" for m in memories)
    
    api_messages = [{"role": "system", "content": system_message}]
    
    for msg in messages[:-1]:
        api_messages.append({"role": msg["role"], "content": msg["content"]})
    
    if attachments and len(attachments) > 0:
        content_parts = []
        if user_content:
            content_parts.append({"type": "text", "text": user_content})
        for att in attachments:
            if att.get('type') == 'image' and att.get('data'):
                image_url = f"data:{att.get('mimeType', 'image/png')};base64,{att['data']}"
                content_parts.append({
                    "type": "image_url",
                    "image_url": {"url": image_url}
                })
        api_messages.append({"role": "user", "content": content_parts})
        model = "gpt-4o"
    else:
        api_messages.append({"role": "user", "content": user_content})
        model = "gpt-3.5-turbo"
    
    def generate():
        full_response = ""
        try:
            stream = client.chat.completions.create(
                model=model,
                messages=api_messages,
                temperature=0.7,
                stream=True
            )
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    yield f"data: {content}\n\n"
            
            yield "data: [DONE]\n\n"
            
            with get_db() as conn:
                with conn.cursor() as cur:
                    cur.execute("INSERT INTO messages (conversation_id, role, content) VALUES (%s, 'assistant', %s)", (conv_id, full_response))
                    
                    if len(messages) == 1:
                        title = user_content[:50] + ("..." if len(user_content) > 50 else "")
                        cur.execute("UPDATE conversations SET title = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s", (title, conv_id))
                    else:
                        cur.execute("UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = %s", (conv_id,))
                    
                    conn.commit()
            
            extract_memories(user_id, user_content, full_response, memories)
            
        except Exception as e:
            yield f"data: [ERROR]{str(e)}\n\n"
    
    return Response(generate(), mimetype='text/event-stream', headers={
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    })

def extract_memories(user_id, user_message, assistant_response, existing_memories):
    if not client:
        return
    
    try:
        existing_list = "\n".join(f"- {m}" for m in existing_memories) if existing_memories else "None yet"
        
        extraction_prompt = f"""Analyze this conversation and extract any NEW important facts about the user that would be helpful to remember for future conversations. Only extract factual information about the user (preferences, personal details, goals, interests, etc.).

Existing memories:
{existing_list}

User said: "{user_message}"
Assistant replied: "{assistant_response}"

Return ONLY new facts not already captured above. Return each fact on its own line. If there are no new facts to remember, respond with exactly "NONE"."""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": extraction_prompt}],
            temperature=0.3,
            max_tokens=200
        )
        
        result = response.choices[0].message.content.strip()
        if result.upper() != "NONE" and result:
            new_memories = [line.strip().lstrip("- ") for line in result.split("\n") if line.strip() and line.strip() != "-"]
            
            with get_db() as conn:
                with conn.cursor() as cur:
                    for memory in new_memories[:3]:
                        if memory and len(memory) > 3:
                            cur.execute("SELECT id FROM memories WHERE user_id = %s AND content = %s", (user_id, memory))
                            if not cur.fetchone():
                                cur.execute("INSERT INTO memories (user_id, content) VALUES (%s, %s)", (user_id, memory))
                    conn.commit()
    except Exception as e:
        print(f"Memory extraction error: {e}")

# Legacy endpoint for compatibility
@app.route('/chat', methods=['POST'])
@app.route('/api/chat', methods=['POST'])
def chat():
    if not client:
        return jsonify({"error": {"message": "OPENAI_API_KEY not set"}}), 500
    
    data = request.get_json()
    if not data or 'messages' not in data:
        return jsonify({"error": {"message": "Missing 'messages' field"}}), 400
    
    messages = data['messages']
    if not isinstance(messages, list) or len(messages) == 0:
        return jsonify({"error": {"message": "Messages must be a non-empty array"}}), 400
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7
        )
        assistant_message = response.choices[0].message.content
        return jsonify({"response": assistant_message, "message": assistant_message})
    except Exception as e:
        return jsonify({"error": {"message": str(e)}}), 500

# ============ MEMORIES ============

@app.route('/api/memories', methods=['GET'])
def list_memories():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Missing X-User-Id header"}), 401
    
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, content, created_at FROM memories WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
            memories = cur.fetchall()
    return jsonify(memories)

@app.route('/api/memories', methods=['POST'])
def add_memory():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Missing X-User-Id header"}), 401
    
    ensure_user(user_id)
    data = request.get_json() or {}
    content = data.get('content')
    
    if not content:
        return jsonify({"error": "Missing 'content' field"}), 400
    
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO memories (user_id, content) VALUES (%s, %s) RETURNING id, content, created_at", (user_id, content))
            memory = cur.fetchone()
            conn.commit()
    return jsonify(memory), 201

@app.route('/api/memories/<int:memory_id>', methods=['DELETE'])
def delete_memory(memory_id):
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Missing X-User-Id header"}), 401
    
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM memories WHERE id = %s AND user_id = %s", (memory_id, user_id))
            conn.commit()
            if cur.rowcount == 0:
                return jsonify({"error": "Memory not found"}), 404
    return jsonify({"success": True})

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 3000))
    app.run(host='0.0.0.0', port=port, debug=False)
