/**
 * Chat Setup Instructions & Testing Guide
 *
 * This file contains setup instructions and testing procedures
 * for the real-time chat feature using Socket.IO.
 */

/**
 * ENVIRONMENT SETUP
 *
 * 1. Make sure your backend server is running on port 4000
 * 2. Add to your client .env.local file:
 *
 * NEXT_PUBLIC_SOCKET_IO_URL=http://localhost:4000
 *
 * 3. Ensure your backend has the socketService properly initialized
 * 4. Make sure CORS is configured to allow your client domain
 */

/**
 * TESTING CHECKLIST
 *
 * ✅ Backend server running with Socket.IO
 * ✅ Frontend can connect to socket server
 * ✅ Groups are loading from GroupsContext
 * ✅ User can select a group from sidebar
 * ✅ Real-time connection status shows correctly
 * ✅ User can send messages in group chat
 * ✅ Messages appear for other users in real-time
 * ✅ Typing indicators work properly
 * ✅ Online user counts update correctly
 *
 */

/**
 * DEBUGGING TIPS
 *
 * 1. Check browser console for Socket.IO connection logs
 * 2. Check backend logs for socket connections and events
 * 3. Use browser dev tools Network tab to see socket connections
 * 4. Verify JWT token is being passed correctly to socket auth
 * 5. Check that groups exist and user belongs to them
 *
 */

/**
 * DUMMY DATA FOR TESTING (if needed)
 *
 * If you need to test without real groups, you can temporarily
 * add dummy data in the GroupsContext or create test groups.
 */

// Test data structure that matches your Group interface
const DUMMY_GROUPS_FOR_TESTING = [
  {
    id: "group-1",
    name: "Family Chat",
    description: "Main family group",
    members: [
      { id: "user-1", name: "John Doe", role: "admin" },
      { id: "user-2", name: "Jane Doe", role: "member" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "group-2",
    name: "Work Team",
    description: "Work collaboration",
    members: [
      { id: "user-1", name: "John Doe", role: "member" },
      { id: "user-3", name: "Bob Smith", role: "admin" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * SOCKET.IO SERVER EVENTS TO VERIFY
 *
 * Client → Server:
 * - join_group
 * - leave_group
 * - send_message
 * - typing_start
 * - typing_stop
 *
 * Server → Client:
 * - message_received
 * - user_joined
 * - user_left
 * - typing_start
 * - typing_stop
 * - error
 *
 */

export { DUMMY_GROUPS_FOR_TESTING };
