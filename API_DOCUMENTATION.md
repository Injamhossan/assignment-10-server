# API Documentation

## Database Setup
- **Database Name:** `study_mate`
- **Collection Name:** `users`

## Environment Variables Required

Create a `.env` file in the root directory with the following variables:

```env
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_URL=*
DB_NAME=study_mate
```

## API Endpoints

### Base URL
```
http://localhost:5000/api
```

### 1. User Registration
**POST** `/api/auth/register`

Register a new user. **Important:** User must be registered in Firebase first. The user will be saved to MongoDB `study_mate` database in the `users` collection.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "firebaseToken": "firebase_id_token_here"
}
```

**Important Requirements:**
- User must be registered in Firebase Authentication first
- Firebase token is required
- Email must match Firebase account email
- If user doesn't exist in Firebase, registration will be rejected

**Response (Success - 201):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "firebaseUID": "firebase_uid"
  }
}
```

**Response (Error - 400):**
```json
{
  "msg": "Email already registered in MongoDB"
}
```

**Response (Error - 401):**
```json
{
  "msg": "Invalid Firebase token. User must be registered in Firebase first."
}
```

### 2. User Login
**POST** `/api/auth/login`

Login with existing credentials. **Important:** User must exist in MongoDB `users` collection. Firebase token is required for verification.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123",
  "firebaseToken": "firebase_id_token_here"
}
```

**Important Requirements:**
- User must be registered in MongoDB `users` collection first
- Firebase token is required
- Email must match Firebase account email
- If user doesn't exist in MongoDB, login will be rejected

**Response (Success - 200):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Response (Error - 400):**
```json
{
  "msg": "Invalid credentials"
}
```

**Response (Error - 404):**
```json
{
  "msg": "User not found. Please register first. User must exist in MongoDB users collection."
}
```

**Response (Error - 401):**
```json
{
  "msg": "Invalid Firebase token. User must be registered in Firebase first."
}
```

### 3. Get User Profile
**GET** `/api/auth/me`

Get current user profile. Requires authentication token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Client-Side Integration Example

### Using Fetch API

#### Register User
```javascript
async function registerUser(name, email, password, firebaseToken) {
  try {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        name, 
        email, 
        password,
        firebaseToken // Firebase ID token from Firebase Auth
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Save token to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log('User registered:', data.user);
      return data;
    } else {
      console.error('Registration failed:', data.msg);
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Example: Register with Firebase Auth
// First, user must sign up/login with Firebase Auth to get the token
// Then use that token to register in MongoDB
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

async function registerWithFirebase(name, email, password) {
  const auth = getAuth();
  
  // Step 1: Create user in Firebase
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseToken = await userCredential.user.getIdToken();
  
  // Step 2: Register in MongoDB with Firebase token
  const result = await registerUser(name, email, password, firebaseToken);
  return result;
}
```

#### Login User
```javascript
async function loginUser(email, password, firebaseToken) {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email, 
        password,
        firebaseToken // Firebase ID token from Firebase Auth
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Save token to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log('User logged in:', data.user);
      return data;
    } else {
      console.error('Login failed:', data.msg);
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Example: Login with Firebase Auth
// First, user must sign in with Firebase Auth to get the token
// Then use that token to login and load data from MongoDB
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

async function loginWithFirebase(email, password) {
  const auth = getAuth();
  
  // Step 1: Sign in with Firebase
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseToken = await userCredential.user.getIdToken();
  
  // Step 2: Login to MongoDB and load user data
  const result = await loginUser(email, password, firebaseToken);
  return result;
}
```

#### Get User Profile
```javascript
async function getUserProfile() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return null;
    }
    
    const response = await fetch('http://localhost:5000/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('User profile:', data.user);
      return data.user;
    } else {
      console.error('Failed to get profile:', data.msg);
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
```

### Using Axios

#### Setup Axios Instance
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

#### Register User
```javascript
async function registerUser(name, email, password, firebaseToken) {
  try {
    const { data } = await api.post('/auth/register', {
      name,
      email,
      password,
      firebaseToken // Firebase ID token from Firebase Auth
    });
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  } catch (error) {
    console.error('Registration failed:', error.response?.data?.msg || error.message);
    return null;
  }
}

// Example with Firebase Auth
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

async function registerWithFirebase(name, email, password) {
  const auth = getAuth();
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseToken = await userCredential.user.getIdToken();
  return await registerUser(name, email, password, firebaseToken);
}
```

#### Login User
```javascript
async function loginUser(email, password, firebaseToken) {
  try {
    const { data } = await api.post('/auth/login', {
      email,
      password,
      firebaseToken // Firebase ID token from Firebase Auth
    });
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  } catch (error) {
    console.error('Login failed:', error.response?.data?.msg || error.message);
    return null;
  }
}

// Example with Firebase Auth
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

async function loginWithFirebase(email, password) {
  const auth = getAuth();
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseToken = await userCredential.user.getIdToken();
  return await loginUser(email, password, firebaseToken);
}
```

#### Get User Profile
```javascript
async function getUserProfile() {
  try {
    const { data } = await api.get('/auth/me');
    return data.user;
  } catch (error) {
    console.error('Failed to get profile:', error.response?.data?.msg || error.message);
    return null;
  }
}
```

## Database Structure

### Users Collection
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

## Notes

1. **Firebase Integration:** 
   - User must be registered in Firebase Authentication first
   - Firebase token is required for both registration and login
   - If user doesn't exist in Firebase, registration/login will be rejected
   - Firebase UID is stored in MongoDB for reference

2. **MongoDB Integration:**
   - All user data is stored in `study_mate` database → `users` collection
   - No separate `login` or `register` collections - all data in `users`
   - If user doesn't exist in MongoDB, login will be rejected (user must register first)

3. **Password Security:** Passwords are hashed using bcrypt before storing in MongoDB

4. **JWT Tokens:** Tokens are used for authentication and expire after 7 days (configurable)

5. **CORS:** Currently configured to allow all origins. Set `CLIENT_URL` in `.env` for production

6. **Email Uniqueness:** Email addresses are stored in lowercase and must be unique

7. **Registration Flow:**
   - Client creates user in Firebase Auth → gets Firebase token
   - Client sends Firebase token + user data to server
   - Server verifies Firebase token
   - Server saves user to MongoDB `users` collection

8. **Login Flow:**
   - Client signs in with Firebase Auth → gets Firebase token
   - Client sends Firebase token + credentials to server
   - Server verifies Firebase token
   - Server loads user from MongoDB `users` collection
   - Server returns JWT token and user data

