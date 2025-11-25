# Changing MongoDB URI - Important Notes

## ⚠️ Why You Still See Old Data

After changing the `MONGO_URI` in your `.env` file, you're still seeing old data because:

1. **MongoDB connection is established when the server starts**
   - The connection is made once when `mongoose.connect()` runs
   - It doesn't reconnect automatically when `.env` changes

2. **The server is still using the old connection**
   - Your backend server is still connected to the old database
   - Changing `.env` doesn't affect a running server

3. **You need to restart the server**
   - The new URI is only read when the server starts
   - Restart is required for the change to take effect

## ✅ How to Switch Databases

### Step 1: Update `.env` File

Make sure your `.env` file has the new URI:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/new-database-name?retryWrites=true&w=majority
```

### Step 2: Restart Backend Server

**This is critical!** The server must be restarted:

```bash
# Stop the current server (Ctrl+C)
# Then start it again
cd ASLI-STUD-BACK
npm start
```

### Step 3: Verify Connection

After restarting, check the console logs. You should see:

```
🔌 Connecting to MongoDB...
📍 URI: mongodb+srv://username:***@cluster.mongodb.net/...
📦 Database: new-database-name
✅ Connected to MongoDB Atlas
📊 Database Name: new-database-name
```

## 🔍 Verify Which Database You're Connected To

The server now logs:
- The MongoDB URI (with password hidden)
- The database name being used
- Connection status

Check your server console when it starts to confirm you're connected to the correct database.

## ⚠️ Important Notes

1. **Different URI = Different Database**
   - If you change the URI to point to a different database, you'll see different data
   - If you change it to the same database (different connection string), you'll see the same data

2. **Database Name in URI**
   - The database name is in the URI: `mongodb+srv://.../DATABASE_NAME?...`
   - Make sure the database name in your new URI is what you expect

3. **Empty Database**
   - If your new database is empty, you won't see any data
   - This is expected if it's a fresh database

4. **Same Cluster, Different Database**
   - If you're using the same MongoDB cluster but different database name, you'll see different data
   - Example: `.../EDU-AI` vs `.../EDU-AI-NEW`

## 🧪 Test the Connection

After restarting, you can verify:

1. **Check server logs** - Should show the new database name
2. **Try logging in** - If it's a new database, you'll need to create users again
3. **Check data** - Should see data from the new database (or empty if it's new)

## 📝 Example

**Old URI:**
```
mongodb+srv://user:pass@cluster.net/EDU-AI?...
```

**New URI:**
```
mongodb+srv://user:pass@cluster.net/EDU-AI-NEW?...
```

After restarting, you'll be connected to `EDU-AI-NEW` database, which will have different (or no) data.

---

**Remember: Always restart the server after changing MONGO_URI!**

