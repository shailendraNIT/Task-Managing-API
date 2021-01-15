const mongoose=require('mongoose');

const connectDB = async function(connUri){
    await mongoose.connect(connUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
    });
    
    const db=mongoose.connection;
    
    db.once('open',()=>{
        console.log(`MongoDB --database connection established successfully`)
    })
    
    db.on('error',(err)=>{
        console.log(`MongoDB connection error.Please make sure MongoDB is running. ${err}`);
        process.exit();
    })
}

module.exports=connectDB;