const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const dotenv = require('dotenv');

dotenv.config();

const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user._id, 
            email: user.email,
            userName: user.userName,
            role: user.roles
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1d' }
    );
};

//Register
exports.create = async(req,res) => {
    try {
        const userData = req.body;

        const isUserExisted = await User.findOne({ email: userData.email });
        if(isUserExisted)
            return res.status(409).json({msg:"This email is already used."});

        const hashedPassword = await bcrypt.hash(userData.password,10);

        const newUser = new User({
            userName:userData.userName,
            email:userData.email,
            password: hashedPassword,
        });

        await newUser.save();

        const token = generateToken(newUser);

        res.status(201).json({token:token});

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Sometingh went wrong", error: error.message });
    }
}

exports.update = async(req,res) => {
    try {
        const userId = req.params.id;
        const { userName, password, currentPassword } = req.body;
        
        const user = await User.findById(userId);
        if(!user)
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        
        const updateFields = {};

        if (userName !== undefined) {
            if (userName !== user.userName) {
                const existingUser = await User.findOne({ userName });
                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        message: 'Username is already taken'
                    });
                }
                updateFields.userName = userName;
            }
        }

        if (password) {
            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is required to change password'
                });
            }
            
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }
            
            // Hash the new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updateFields.password = hashedPassword;
        }
        
        // If no fields to update, return early
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update provided'
            });
        }

        // Update the user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true}
        );
        
        return res.status(200).json({
            success: true,
            message: 'User updated successfully',
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error.message
        });
    }
}

exports.delete = async(req,res) => {
    try {
        const userId = req.params.id;
        if(!userId)
            return res.status(400).json({msg:"Id is required"});

        const deletedUser = await User.findByIdAndDelete(userId);
        if(!deletedUser)
            return res.status(400).json({msg:"No user found"});

        return res.status(200).json({
                success:true,
                message:"User deleted successfully"    
            });

    } catch (error) {
        return res.status(500).json({ message: "Sometingh went wrong", error: error.message });
    }
}

exports.getOne = async(req,res) => {
    try {
        const userId = req.params.id;        
        if(!userId)
            return res.status(400).json({msg:"Id is required"});

        const user = await User.findOne({_id:userId});
        if(!user)
            return res.status(400).json({msg:"No user found"});

        return res.status(200).json({
            success:true,
            data:user
        })        
    } catch (error) {
        return res.status(500).json({ message: "Sometingh went wrong", error: error.message });
    }
}

exports.getAll = async(req,res) => {
    try {
        const {page = 1, limit = 10 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const users = await User.find({})
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip)
            .limit(parseInt(limit));

        const totalUsers = await User.countDocuments();

        if(!users)
            return res.status(400).json({msg:"There is no user found"});
        
        return res.status(200).json({
            success:"true",
            data:users,
            pagination: {
                totalUsers,
                totalPages: Math.ceil(totalUsers / parseInt(limit)),
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        })
    } catch (error) {
        return res.status(500).json({ message: "Sometingh went wrong", error: error.message });
    }
}

exports.login = async(req,res) => {
    try {
        const { email, password } = req.body;
        
        const user = await  User.findOne({email});
        if(!user)
            return res.status(400).json({msg:"There is no user registered with that email"});

        const isPassValid = await bcrypt.compare(password,user.password);
        if(!isPassValid)
            return res.status(401).json({ message: "Invalid Password" });

        const token = generateToken(user);

        res.status(200).json({
            message: "Login is successfull",
            token,
        })

    } catch (error) {
        return res.status(500).json({ message: "Sometingh went wrong", error: error.message });
    }
}



module.exports = exports;