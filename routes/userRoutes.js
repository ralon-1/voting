const express = require('express');
const router = express.Router();
const User = require('./../models/user');
const {jwtAuthMiddleware, generateToken} = require('./../jwt');


// POST route to add a person
router.post('/signup', async (req, res) =>{
    try{
        const data = req.body // Assuming the request body contains the User data

        // Check if there is already an admin user
        const adminUser = await User.findOne({ role: 'admin' });
        if (data.role === 'admin' && adminUser) {
            return res.status(400).json({ error: 'Admin user already exists' });
        }

        // Validate Aadhar Card Number must have exactly 12 digit
        if (!/^\d{12}$/.test(data.aadharCardNumber)) {
            return res.status(400).json({ error: 'Aadhar Card Number must be exactly 12 digits' });
        }

        // Check if a user with the same Aadhar Card Number already exists
        const existingUser = await User.findOne({ aadharCardNumber: data.aadharCardNumber });
        if (existingUser) {
            return res.status(400).json({ error: 'User with the same Aadhar Card Number already exists' });
        }

        // Create a new User document using the Mongoose model
        const newUser = new User(data);

        // Save the new user to the database
        const response = await newUser.save();
        console.log('data saved');

        const payload = {
            id: response.id
        }
        console.log(JSON.stringify(payload));
        const token = generateToken(payload);

        res.status(200).json({response: response, token: token});
    }
    catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

// Login Route
router.post('/login', async(req, res) => {
    try{
        // Extract aadharCardNumber and password from request body
        const {aadharCardNumber, password} = req.body;
            console.log("all set ")
        // Check if aadharCardNumber or password is missing
        if (!aadharCardNumber || !password) {
            return res.status(400).json({ error: 'Aadhar Card Number and password are required' });
        }

        // Find the user by aadharCardNumber
        const user = await User.findOne({aadharCardNumber: aadharCardNumber});

        // If user does not exist or password does not match, return error
        // if( !user || !(await user.comparePassword(password))){
        //     return res.status(401).json({error: 'Invalid Aadhar Card Number or Password'});
        // }

        // generate Token 
        const payload = {
            id: user.id,
        }
        const token = generateToken(payload);

        // resturn token as response
        // console.log({token})
        res.json({token})
    }catch(err){
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error in login route ' });
    }
});

// Profile route
router.get('/profile', jwtAuthMiddleware, async (req, res) => {
    try{
        const userData = req.user;
        // console.log(userData)
        const userId = userData.id;
        const user = await User.findById(userId);
        res.status(200).json({user});
    }catch(err){
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

//  update the profile
router.post('/profile/edit',jwtAuthMiddleware,async (req,res)=>{
    try{

        // in req.user we have id 
        console.log("on profile update route")
        const userid=req.user.id;
        const newdata=req.body;
        const response=await User.findByIdAndUpdate(userid,newdata,{
            new:true
        })
        if (!response) {
            return res.status(404).json({ error: ' in profile update , user not found' });
        }
        console.log(" update done")
        res.status(200).json(response)
    }
    catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error in profile update route happen'});
    }
    

})
module.exports = router;
