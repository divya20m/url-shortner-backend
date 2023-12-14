import { Client } from "./index.js";
import bcrypt from "bcrypt"

export async function genPassword(password) {
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
   return hashedPassword
}

    export async function createUser(firstname,lastname,email, hashedPassword) {
        return await Client.db("url-shortner").collection("url-shortning-userinfo").insertOne({email:email,password:hashedPassword,firstname:firstname,lastname:lastname});
    }

    
    export async function getUsersByEmail(email) {
        return await Client.db("url-shortner").collection("url-shortning-userinfo").findOne({email:email});
    }

     
    export async function getAllUsers() {
        return await Client.db("url-shortner").collection("url-shortning-userinfo").find().toArray()
    }

    export async function getByID(id, token) {
        return await Client.db("url-shortner").collection("url-shortning-userinfo").find({ email })
    }

    export async function resetPassword(encryptedPassword, email) {
        return await Client.db("url-shortner").collection("url-shortning-userinfo").updateOne(
          { email: email },
          { $set: { password: encryptedPassword } }
        );
      }

      export async function DeleteUsersByEmail(email) {
        return await Client.db("url-shortner").collection("url-shortning-userinfo").deleteOne({ email:email })
    }
////////////////////////////////////////////

    export async function getAllURLs(originalURL) {
        return await Client.db("url-shortner").collection("url-shortner").findOne({ originalURL:originalURL })
    }

    
    export async function createURL(originalURL,shortURL,urlId, date,email) {
        return await Client.db("url-shortner").collection("url-shortner").insertOne({ originalURL:originalURL,shortURL:shortURL,urlId:urlId,date: new Date(),email:email });
    }

    export async function getAll() {
        return await Client.db("url-shortner").collection("url-shortner").find().toArray();
    }

    export async function deleteURL(urlId) {
        return await Client.db("url-shortner").collection("url-shortner").deleteOne({ urlId :urlId});
    }
    export async function getURLsByEmail(email) {
        return await Client.db("url-shortner").collection("url-shortner").find({ email: email }).toArray();
    }
    
    
