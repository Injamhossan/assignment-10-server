# Setup Guide - Study Mate Server

## Database Configuration

✅ **Database Name:** `study_mate`  
✅ **Collection Name:** `users`

## কি কি Setup করা হয়েছে?

1. **Firebase Integration** - Firebase Admin SDK initialized, Firebase token verification required
2. **MongoDB Connection** - `study_mate` database এ connect হবে automatically
3. **Users Collection** - Signup/login এর data `users` collection এ save হবে (কোনো `login` বা `register` collection নেই)
4. **CORS Configuration** - Client side থেকে server এ connection করতে পারবে
5. **JWT Authentication** - Secure token-based authentication
6. **API Endpoints** - Register, Login, এবং Profile endpoints ready

## গুরুত্বপূর্ণ Points

- ✅ **Firebase Required:** User must be registered in Firebase Authentication first
- ✅ **Firebase Token:** Firebase token required for both registration and login
- ✅ **MongoDB Storage:** All data saved in `study_mate` database → `users` collection
- ✅ **No Entry Without Firebase:** If user doesn't exist in Firebase, entry will be rejected
- ✅ **No Login Without MongoDB:** If user doesn't exist in MongoDB, login will be rejected

## Environment Variables Setup

`.env` file create করুন root directory তে:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_URL=*
DB_NAME=study_mate
```

## API Endpoints

### 1. User Registration (Signup)
**POST** `http://localhost:5000/api/auth/register`

**Important:** User must be registered in Firebase Authentication first. Firebase token is required.

```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123",
  "firebaseToken": "firebase_id_token_here"
}
```

**Response (Success):**
```json
{
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "firebaseUID": "firebase_uid"
  }
}
```

**Response (Error - Firebase token invalid):**
```json
{
  "msg": "Invalid Firebase token. User must be registered in Firebase first."
}
```

### 2. User Login
**POST** `http://localhost:5000/api/auth/login`

**Important:** User must exist in MongoDB `users` collection. Firebase token is required.

```json
{
  "email": "user@example.com",
  "password": "password123",
  "firebaseToken": "firebase_id_token_here"
}
```

**Response (Success):**
```json
{
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "user"
  }
}
```

**Response (Error - User not found in MongoDB):**
```json
{
  "msg": "User not found. Please register first. User must exist in MongoDB users collection."
}
```

**Response (Error - Firebase token invalid):**
```json
{
  "msg": "Invalid Firebase token. User must be registered in Firebase first."
}
```

### 3. Get Profile
**GET** `http://localhost:5000/api/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

## Client Side থেকে কিভাবে Use করবেন?

### JavaScript/React Example with Firebase

```javascript
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// Register User (with Firebase)
async function register(name, email, password) {
  try {
    // Step 1: Create user in Firebase Authentication
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseToken = await userCredential.user.getIdToken();
    
    // Step 2: Register in MongoDB with Firebase token
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        name, 
        email, 
        password,
        firebaseToken // Firebase ID token
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log('User registered successfully!');
      return data;
    } else {
      console.error('Registration failed:', data.msg);
      return null;
    }
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

// Login User (with Firebase)
async function login(email, password) {
  try {
    // Step 1: Sign in with Firebase Authentication
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseToken = await userCredential.user.getIdToken();
    
    // Step 2: Login to MongoDB and load user data
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email, 
        password,
        firebaseToken // Firebase ID token
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log('User logged in successfully!');
      return data;
    } else {
      console.error('Login failed:', data.msg);
      return null;
    }
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}
```

## Server Start করা

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Database Structure

### Users Collection Schema
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, lowercase),
  password: String (hashed with bcrypt),
  firebaseUID: String (Firebase User UID),
  role: String (default: 'user'),
  createdAt: Date,
  updatedAt: Date
}
```

**Note:** সব data `users` collection এ save হয়। `login` বা `register` নামে কোনো separate collection নেই।

## Important Notes

1. ✅ **Firebase Integration:** 
   - User must be registered in Firebase Authentication first
   - Firebase token required for registration and login
   - If user doesn't exist in Firebase, entry will be rejected

2. ✅ **Database:** Automatically connects to `study_mate` database
3. ✅ **Collection:** Data saves to `users` collection (no separate `login` or `register` collections)
4. ✅ **Password:** Automatically hashed before saving
5. ✅ **Email:** Stored in lowercase and must be unique
6. ✅ **CORS:** Configured to allow client-side connections
7. ✅ **Token:** JWT token expires in 7 days (configurable)
8. ✅ **Registration Flow:** Firebase Auth → MongoDB `users` collection
9. ✅ **Login Flow:** Firebase Auth → Load from MongoDB `users` collection
10. ✅ **No Entry Without Firebase:** If user doesn't exist in Firebase, registration/login will be rejected
11. ✅ **No Login Without MongoDB:** If user doesn't exist in MongoDB, login will be rejected

## Testing

1. Server start করুন: `npm run dev`
2. MongoDB connection check করুন: Console এ `✅ MongoDB connected successfully` message দেখবেন
3. Client side থেকে API call করুন
4. MongoDB Compass এ `study_mate` database → `users` collection এ data check করুন

## Support

Full API documentation: `API_DOCUMENTATION.md` file এ দেখুন।

