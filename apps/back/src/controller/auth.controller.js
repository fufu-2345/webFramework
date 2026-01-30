const { db } = require("../config/db.js");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const registerUsers = async(req, res) => {
    try{
        const {username , password , email} = req.body;

        if(!username || !password || !email){
            return res.status(400).json({ message: "All fields are required" });
        }

        const [existingUser] = await db.query("SELECT id FROM users WHERE email =?" , [email]);
        if(existingUser.length > 0){
            return res.status(409).json({ message: "User already exists" });
        }
        const hashPass = await bcrypt.hash(password, 10);
        await db.query("INSERT INTO users (username, email, password) VALUES (?,?,?)", [username, email, hashPass]);
        res.status(201).json({ message: "User registered successfully" });


    
    }
    catch(err){
        console.error("Register error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}


const loginUsers = async(req , res) => {
    try{
        const {email , password} = req.body ;
        if(!email || !password){
            return res.status(400).json({ message: "All fields are required" });
        }
        const [user] = await db.query("SELECT * FROM users WHERE email =?" , [email]);
        if(user.length === 0){
            return res.status(401).json({ message: "Invalid Email" });
        }
        const validPass = await bcrypt.compare(password , user[0].password);
        if(!validPass){
            return res.status(401).json({ message: "Invalid Password" });
        }
        const token = jwt.sign({id:user[0].id , role: user[0].role}, process.env.JWT_SECRET , {expiresIn: '1h'});
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: "strict", maxAge: 60 * 60 *1000 });
        res.status(200).json({ token ,message: "Login successful" });


    }
    catch(err){
        console.error("Login error:", err);
        res.status(500).json({ message: "Internal server error" });
    }

}

const getMe = async (req, res) => {
        const userId = req.user.id ;
        const [row] =await db.query("SELECT id, username, email, role FROM users WHERE id =?" , [userId]);
        res.status(200).json({user: row[0]});

}

const logoutUsers = (req,res) => {
    res.clearCookie('token') ;
    res.json({ message: "Logged out successfully" }) ;
}

module.exports ={ registerUsers , loginUsers, getMe, logoutUsers};