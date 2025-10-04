import mongoose from "mongoose";

let isConnected = false; //Variable to track the connected connection

export const connectToDB = async () => {
    mongoose.set('strictQuery',true);

    if(!process.env.MONGODB_URI) return console.log("MONGODB_URI is not defined!");

    if(isConnected) return console.log('=> using existing databse connection');

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        isConnected = true;
        return console.log('MONGODB connected');
    } catch (error) {
        console.log(error);
    }
}
//BYxLx8ik4Qp2UrzX - Passowrd
//harsh162PriceWise - Username