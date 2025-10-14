const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../testingServer'); 
require('dotenv').config();
const User = require('../models/user');



beforeAll(async () => {
    await mongoose.connect(process.env.DATABASE_URI_TEST);
})

afterAll(async () => {
    await mongoose.disconnect(process.env.DATABASE_URI_TEST);
})



test('Login API test' ,async ()=>{
    const res = await request(app).
    post('/api/users/login').send({
        "identifier" : "68ed5439b5d0fbe15fbdfc19",
        "password" : "123456789"
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('id');
})


test('Register API test' ,async ()=>{

    const testUser = {
      fullname: 'Salah Gamal',
      username: 'Salah_G',
      phone: '01557786305',
      email: 'salahgamal@example.com',
      password: '123456789',
      type: 'client',
      clientType:"personal",
      ssn:"30410012803638"
    }

    const res = await request(app)
    .post('/api/auth/signup')
    .send(testUser);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('id');
})


test("Register with already used email should fail",async ()=>{
    const testUser = {
      fullname: 'Salah Gamal',
      username: 'Salah_G',
      phone: '01557786305',
      email: 'a@example.com',
      password: '123456789',
      type: 'client',
      clientType:"personal",
      ssn:"30410012803638"
    }
    const res = await request(app)
    .post('/api/auth/signup')
    .send(testUser);
    expect(res.statusCode).toEqual(409);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toBe('A user with that email, username, or phone number already exists.');
})