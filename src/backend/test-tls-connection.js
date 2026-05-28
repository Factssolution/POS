const tls = require('tls');
const dns = require('dns');

// Force IPv4
dns.setDefaultResultOrder('ipv4first');

console.log('🧪 Testing raw TLS connection to Supabase pooler...\n');

// Resolve DNS first
dns.lookup('aws-1-ap-south-1.pooler.supabase.com', { family: 4 }, (err, address, family) => {
  if (err) {
    console.error('❌ DNS lookup failed:', err.message);
    return;
  }
  
  console.log('✅ DNS resolved to:', address, '(IPv' + family + ')');
  
  // Try TLS connection
  const socket = tls.connect({
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 6543,
    servername: 'aws-1-ap-south-1.pooler.supabase.com',
    rejectUnauthorized: false
  }, () => {
    console.log('✅ TLS connection established!');
    console.log('🔐 Authorized:', socket.authorized);
    console.log('🔐 SNI sent:', socket.servername);
    socket.end();
  });
  
  socket.on('error', (err) => {
    console.error('❌ TLS connection failed:', err.message);
    console.error('   Code:', err.code);
  });
});
