# Study Mate (Backend Server)

এটি "Study Mate" অ্যাপ্লিকেশনের অফিসিয়াল ব্যাকএন্ড সার্ভার। এটি Node.js, Express.js এবং Firebase ব্যবহার করে তৈরি করা হয়েছে।

## 🚀 প্রধান প্রযুক্তি (Technologies Used)

* **Node.js:** সার্ভার-সাইড রানটাইম এনভায়রনমেন্ট।
* **Express.js:** Node.js এর জন্য একটি মিনিমালিস্ট ওয়েব ফ্রেমওয়ার্ক।
* **Firebase Admin SDK:** Firebase পরিষেবাগুলির সাথে ব্যাকএন্ড সার্ভারের যোগাযোগের জন্য।
* **Vercel:** প্রোডাকশন ডিপ্লয়মেন্ট এবং হোস্টিং এর জন্য।

## 🌐 Base URL

**Local Development:**
```
http://localhost:5000
```

**Production (Vercel):**
```
https://assignment-10-server-ivory-eta.vercel.app
```

---

## 📚 API Endpoints

### 🔐 Authentication Routes (`/api/auth`)

#### 1. User Registration
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "firebaseToken": "firebase_id_token_here"
}
```

**Response (201):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id_here",
    "name": "John Doe",
    "email": "john@example.com",
    "firebaseUID": "firebase_uid",
    "sentRequests": []
  }
}
```

---

#### 2. User Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123",
  "firebaseToken": "firebase_id_token_here"
}
```

**Response (200):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id_here",
    "name": "John Doe",
    "email": "john@example.com",
    "sentRequests": []
  }
}
```

---

#### 3. Get Current User Profile
**GET** `/api/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "user_id_here",
  "name": "John Doe",
  "email": "john@example.com",
  "sentRequests": []
}
```

---

#### 4. Update User Profile
**PUT** `/api/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Updated"
}
```

**Response (200):**
```json
{
  "msg": "Profile updated successfully",
  "user": { ... }
}
```

---

#### 5. Delete User Profile
**DELETE** `/api/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "msg": "User and associated partner profile deleted successfully"
}
```

---

### 👥 Partner Request Routes (`/api/auth`)

#### 6. Send Partner Request
**POST** `/api/auth/request/send/:partnerId`

**Headers:**
```
Authorization: Bearer <token>
```

**Parameters:**
- `partnerId` - Partner document ID (from partners collection)

**Response (200):**
```json
{
  "msg": "Request sent successfully",
  "requestId": "request_document_id"
}
```

**Note:** Request data MongoDB এর `requests` collection এ store হবে:
```json
{
  "senderId": "user_id_who_sent",
  "receiverId": "user_id_who_received",
  "senderName": "Sender Name",
  "receiverName": "Receiver Name",
  "status": "pending",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

#### 7. Cancel Partner Request
**DELETE** `/api/auth/request/cancel/:partnerId`

**Headers:**
```
Authorization: Bearer <token>
```

**Parameters:**
- `partnerId` - Partner document ID

**Response (200):**
```json
{
  "msg": "Request cancelled successfully"
}
```

**Note:** Request MongoDB এর `requests` collection থেকে delete হবে।

---

#### 8. Get All Requests (Sent & Received)
**GET** `/api/auth/requests`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `type=sent` - শুধু sent requests
- `type=received` - শুধু received requests
- No parameter - সব requests (sent + received)

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "type": "all",
  "data": [
    {
      "_id": "request_id_1",
      "requestId": "request_id_1",
      "senderId": "user_id_1",
      "receiverId": "user_id_2",
      "senderName": "John Doe",
      "receiverName": "Jane Smith",
      "senderEmail": "john@example.com",
      "receiverEmail": "jane@example.com",
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "isSentByMe": true,
      "isReceivedByMe": false
    }
  ]
}
```

---

### 🤝 Partners Routes (`/api/partners`)

#### 9. Get All Partners
**GET** `/api/partners`

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "database": "study_mate",
  "collection": "partners",
  "data": [
    {
      "_id": "partner_id",
      "email": "partner@example.com",
      "image": "image_url",
      "name": "Partner Name",
      "subject": "Mathematics",
      "level": "Intermediate",
      "activeStatus": "Online",
      "rating": 4.5,
      "about": "About text",
      "location": "Location",
      "availability": "Available",
      "requestCount": 5
    }
  ]
}
```

---

#### 10. Get Partner by ID
**GET** `/api/partners/:id`

**Parameters:**
- `id` - Partner document ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "partner_id",
    "email": "partner@example.com",
    "name": "Partner Name",
    "subject": "Mathematics",
    "level": "Intermediate",
    "activeStatus": "Online",
    "rating": 4.5,
    "about": "About text",
    "location": "Location",
    "availability": "Available",
    "requestCount": 5,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### 11. Create Partner Profile
**POST** `/api/partners`

**Request Body:**
```json
{
  "email": "partner@example.com",
  "image": "image_url",
  "name": "Partner Name",
  "subject": "Mathematics",
  "level": "Intermediate",
  "activeStatus": "Online",
  "rating": 4.5,
  "about": "About text",
  "location": "Location",
  "availability": "Available"
}
```

**Response (201):**
```json
{
  "success": true,
  "msg": "Partner created successfully",
  "data": { ... }
}
```

---

#### 12. Update Partner Profile
**PUT** `/api/partners/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Parameters:**
- `id` - Partner document ID

**Request Body:**
```json
{
  "name": "Updated Name",
  "subject": "Physics",
  "level": "Advanced"
}
```

**Response (200):**
```json
{
  "success": true,
  "msg": "Partner profile updated successfully",
  "data": { ... }
}
```

---

## 📊 Database Collections

### `users` Collection
User accounts এবং authentication data store করে।

### `partners` Collection
Partner profiles store করে। `requestCount` field automatically increment/decrement হয়।

### `requests` Collection
Partner requests store করে:
- `senderId` - Request পাঠানো user এর ID
- `receiverId` - Request পাওয়া user এর ID
- `senderName` - Sender এর name
- `receiverName` - Receiver এর name
- `status` - Request status (pending, accepted, rejected, cancelled)
- `createdAt` - Request creation timestamp
- `updatedAt` - Last update timestamp

---

## 🔑 Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## 📝 Client Side Integration Guide

### ✅ Good News: **কোনো Major Change লাগবে না!**

Backend automatically handle করছে demo users এবং real users - দুটোর জন্যেই request যাবে। Client side এ শুধু API call করতে হবে।

### 🔧 Client Side এ যা করতে হবে:

#### 1. **Base URL Setup**
```javascript
// .env file বা config file এ
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
// Production: 'https://assignment-10-server-ivory-eta.vercel.app'
```

#### 2. **Send Request Function**
```javascript
const sendRequest = async (partnerId, token) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/auth/request/send/${partnerId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.msg || 'Failed to send request');
    }
    
    return data;
  } catch (error) {
    console.error('Send request error:', error);
    throw error;
  }
};

// Usage:
// const result = await sendRequest(partnerId, userToken);
// console.log(result.msg); // "Request sent successfully"
// console.log(result.requestId); // Request document ID
```

**Important:** 
- `partnerId` হতে পারে partner document ID **অথবা** user ID
- Backend automatically detect করবে এবং handle করবে
- Demo users এবং real users - দুটোর জন্যেই কাজ করবে

#### 3. **Get All Requests Function**
```javascript
const getRequests = async (token, type = 'all') => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/auth/requests?type=${type}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.msg || 'Failed to fetch requests');
    }
    
    return data;
  } catch (error) {
    console.error('Get requests error:', error);
    throw error;
  }
};

// Usage:
// const allRequests = await getRequests(token); // All requests
// const sentRequests = await getRequests(token, 'sent'); // Only sent
// const receivedRequests = await getRequests(token, 'received'); // Only received

// Response structure:
// {
//   success: true,
//   count: 5,
//   type: "all",
//   data: [
//     {
//       _id: "request_id",
//       senderId: "user_id_1",
//       receiverId: "user_id_2",
//       senderName: "John Doe",
//       receiverName: "Jane Smith",
//       status: "pending",
//       isSentByMe: true,
//       isReceivedByMe: false,
//       createdAt: "2024-01-01T00:00:00.000Z"
//     }
//   ]
// }
```

#### 4. **Cancel Request Function**
```javascript
const cancelRequest = async (partnerId, token) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/auth/request/cancel/${partnerId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.msg || 'Failed to cancel request');
    }
    
    return data;
  } catch (error) {
    console.error('Cancel request error:', error);
    throw error;
  }
};

// Usage:
// const result = await cancelRequest(partnerId, userToken);
// console.log(result.msg); // "Request cancelled successfully"
```

#### 5. **Get All Partners Function**
```javascript
const getPartners = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/partners`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.msg || 'Failed to fetch partners');
    }
    
    return data;
  } catch (error) {
    console.error('Get partners error:', error);
    throw error;
  }
};

// Usage:
// const partners = await getPartners();
// partners.data.forEach(partner => {
//   console.log(partner.name, partner.requestCount);
// });
```

### 📋 Complete Example (React Component)

```javascript
import { useState, useEffect } from 'react';

function PartnerRequests() {
  const [partners, setPartners] = useState([]);
  const [requests, setRequests] = useState([]);
  const token = localStorage.getItem('token'); // Your token storage

  // Get all partners
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const data = await getPartners();
        setPartners(data.data);
      } catch (error) {
        console.error('Error fetching partners:', error);
      }
    };
    fetchPartners();
  }, []);

  // Get all requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await getRequests(token);
        setRequests(data.data);
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    };
    fetchRequests();
  }, [token]);

  // Handle send request
  const handleSendRequest = async (partnerId) => {
    try {
      const result = await sendRequest(partnerId, token);
      alert(result.msg);
      // Refresh requests
      const data = await getRequests(token);
      setRequests(data.data);
    } catch (error) {
      alert(error.message);
    }
  };

  // Handle cancel request
  const handleCancelRequest = async (partnerId) => {
    try {
      const result = await cancelRequest(partnerId, token);
      alert(result.msg);
      // Refresh requests
      const data = await getRequests(token);
      setRequests(data.data);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div>
      <h2>Partners</h2>
      {partners.map(partner => (
        <div key={partner._id}>
          <h3>{partner.name}</h3>
          <p>Request Count: {partner.requestCount || 0}</p>
          <button onClick={() => handleSendRequest(partner._id)}>
            Send Request
          </button>
        </div>
      ))}

      <h2>My Requests</h2>
      {requests.map(request => (
        <div key={request._id}>
          <p>
            {request.isSentByMe 
              ? `Sent to: ${request.receiverName}`
              : `Received from: ${request.senderName}`
            }
          </p>
          {request.isSentByMe && (
            <button onClick={() => handleCancelRequest(request.receiverId)}>
              Cancel Request
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

### ⚠️ Important Notes for Client Side:

1. **PartnerId Format:**
   - `partnerId` হতে পারে partner document ID **অথবা** user ID
   - Backend automatically handle করবে
   - Demo users এবং real users - দুটোর জন্যেই কাজ করবে

2. **Error Handling:**
   - সব API call এ proper error handling করুন
   - Network errors এবং API errors handle করুন

3. **Token Management:**
   - JWT token properly store করুন (localStorage/sessionStorage)
   - প্রতিটি request এ token include করুন

4. **Request State Management:**
   - Request send/cancel করার পর requests list refresh করুন
   - Optimistic updates ব্যবহার করতে পারেন better UX এর জন্য

5. **No Breaking Changes:**
   - Existing client code কাজ করবে
   - শুধু নতুন features (getRequests) add করতে পারেন

---

## ⚠️ Error Responses

All errors follow this format:

```json
{
  "msg": "Error message here",
  "success": false
}
```

**Common Status Codes:**
- `400` - Bad Request (Invalid input)
- `401` - Unauthorized (Missing or invalid token)
- `404` - Not Found (Resource not found)
- `500` - Server Error

---

## 🚀 Getting Started

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with required variables:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64_encoded_firebase_credentials
```

3. Run locally:
```bash
npm start
# or
npm run dev
```

4. Server will run on `http://localhost:5000`