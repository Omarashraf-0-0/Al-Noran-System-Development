db.createUser({
  user: 'meanuser',
  pwd: 'meanpass123',
  roles: [
    {
      role: 'readWrite',
      db: 'meanapp'
    }
  ]
});

db.createCollection('users');
db.createCollection('products');