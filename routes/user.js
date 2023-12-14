import express from "express";
import {genPassword,createUser,getUsersByEmail,getAllUsers,resetPassword,DeleteUsersByEmail,getAllURLs,createURL,getAll,deleteURL,getURLsByEmail} from "../functions.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import shortid from "shortid";
import { auth } from "../middleware/auth.js";

const router=express.Router()


//get all users
router.get("/",async (req, res)=>{
    const result=await getAllUsers()
    res.send(result)
})

//delete all users using email
router.delete("/:email",async (req, res)=>{
    const{email}=req.params
    const result=await DeleteUsersByEmail(email)
    res.send(result)
})


//signing up two step verification
  router.post("/signup", express.json(), async (req, res) => {
    const { firstname, lastname, email, password } = req.body;
  
    const isUserExist = await getUsersByEmail(email);
  
    if (isUserExist) {
      return res.status(400).json({ error: "Email already exists" });
    } else {
      try {
        const hashedPassword = await genPassword(password);
        const result = await createUser(firstname, lastname, email, hashedPassword);
  
       
        const secret = process.env.secretkey;
        const token = jwt.sign({ email }, secret, { expiresIn: '1h' });
        const activationLink = `http://localhost:3000/shorturl/activate/${token}`;
  
        
        console.log("Activation Link:", activationLink);
  
        return res.status(201).json({
          message: "User signed up successfully. Activation link displayed in console.",
          result,activationLink,token
        });
      } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json('Server Error');
      }
    }
  });
  


  //activating page after signing in
  router.get("/activate/:token", async (req, res) => {
    const { token } = req.params;
  
    try {
      const secret = process.env.secretkey;
      const decoded = jwt.verify(token, secret);
  
      const { email } = decoded;
      const isUserExist = await getUsersByEmail(email);
  
      if (!isUserExist) {
        return res.status(404).json({ error: "User not found" });
      }
  
      return res.status(200).json({ message: "Account activated successfully", email });
    } catch (error) {
      console.error('Error activating account:', error);
      if (error.name === 'JsonWebTokenError') {
        return res.status(400).json({ error: 'Invalid token' });
      }
      return res.status(500).json('Server Error');
    }
  });



//loging in
router.post("/login", express.json(), async (req, res) => {
    const {email, password} = req.body
const userFromDb =await getUsersByEmail(email)
if(!userFromDb){
    res.status(400).send({message:"Invalid EmailID"})
return 
}
const storedDbPassword = userFromDb.password
const isPasswordMatch=await bcrypt.compare(password,storedDbPassword)
if(!isPasswordMatch){
    res.status(400).send({message:"Invalid Password"})
return 
}
const token = jwt.sign({id:userFromDb._id},process.env.secretkey)
res.send({message:"Login Successful", token:token})
})


//forget password
router.post("/forgot-password", express.json(), async (req, res) => {
    const { email } = req.body;
    try {
      const user = await getUsersByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User Not Found" });
      }
      
      const secret = process.env.secretkey;
      const token = jwt.sign({ email: user.email }, secret, { expiresIn: '1h' });
      const resetLink = `http://localhost:3000/shorturl/reset-password/${email}/${token}`;
      return res.json({ message: "Reset link generated successfully.Reset link generated successfully,kindly check the console and click the link which directs you to change your passwords" , resetLink});
  
    } catch (error) {
      console.error("Error generating reset link:", error);
      return res.status(500).json({ error: "Failed to generate reset link" });
    }
  });
  





//get users by email id
router.get("/reset-password/:email/:token", express.json(), async (req, res) => {
    const { email,token} = req.params;
    const oldUser = await getUsersByEmail(email)
  
    if (!oldUser) {
      return res.status(404).send({ status: "User Not Exists!!" });
    }
  
    return res.send(oldUser);
  });
  

  //reset password
  router.post("/reset-password/:email/:token",express.json(), async (req, res) => {
    const { email, token } = req.params;
    const { password } = req.body;
  
    const oldUser = await getUsersByEmail(email)
    if (!oldUser) {
      return res.json({ status: "User Not Exists!!" });
    }
    const secret = process.env.secretkey
    try {
      const verify = jwt.verify(token, secret);
      const encryptedPassword = await bcrypt.hash(password, 10);
      const updateuser = await resetPassword(encryptedPassword, email)
      res.json({ email: verify.email, status: "verified", message:"Password Successfully Changed" });
    } catch (error) {
      console.log(error);
      res.json({ status: "Something Went Wrong" });
    }
});


//get the reset password using the link
router.get("/reset-password/:email/:token",express.json(), async (req, res) => {
  const { email, token } = req.params;

  const oldUser = await getUsersByEmail(email)
  if (!oldUser) {
    return res.json({ status: "User Not Exists!!" });
  }
  try {
    const result=oldUser
    res.redirect(`http://localhost:9050/reset-password/${email}/${token}`);

  } catch (error) {
    console.log(error);
    res.json({ status: "Something Went Wrong" });
  }
});

//get userdata
router.post("/userData", express.json(), async (req, res) => {
  const { token } = req.body;
  try {
    const user = jwt.verify(token, process.env.secretkey, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });
    console.log(user);
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }

    const useremail =  getUsersByEmail(email)
      .then((data) => {
        res.send({ status: "ok", data: data });
      })
      .catch((error) => {
        res.send({ status: "error", data: error });
      });
  } catch (error) { }
});

//url-shortning endpoints

//shortnening url
router.post('/shorten', auth, express.json(), async (req, res) => {
  const { urls } = req.body;
  const base = "http://localhost:9050";
  const results = [];
  const email = req.user.email;

  try {
    for (const url of urls) {
      const shortURL = `${base}/${shortid.generate()}`;
      const result = await createURL(url, shortURL, shortURL, new Date(), email);
      results.push({ originalURL: url, shortURL, urlId: shortURL, date: new Date(), email, result });
    }

    res.json(results);
  } catch (error) {
    console.error('Error shortening URLs:', error);
    res.status(500).json({ error: "Server Error" });
  }
});


  
// GET endpoint to retrieve user's shortened URLs
router.get("/shorten", auth, async (req, res) => {
  try {
    const email = req.user.email; 
    const userURLs = await getURLsByEmail(email); 

    res.json(userURLs);
  } catch (error) {
    console.error("Error fetching user's shortened URLs:", error);
    res.status(500).json({ error: "Server Error" });
  }
});


// Endpoint to delete a specific shortened URL
router.delete("/:urlId", async (req, res) => {
  const { urlId } = req.params;
  
  try {
    const result = await deleteURL(urlId);
    console.log(result)
    res.send(result);
  } catch (error) {
    console.error('Error deleting URL:', error);
    res.status(500).json('Server Error');
  }
});


export const usersRouter=router