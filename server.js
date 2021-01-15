require('dotenv').config();
const express=require('express');
const taskRouter=require('./routes/task');
const userRouter=require('./routes/user');
const connectDB=require('./db/mongoose');
const app=express();

const port=process.env.PORT || 3000;
const connUri=process.env.MONGO_CONN_URI;





app.use(express.json())
app.use('/api/tasks',taskRouter);
app.use('/api/users',userRouter);

connectDB(connUri);

app.get('/',(req,res)=>{
    res.send('hello');
})


app.listen(port,()=>{
    console.log(`server is up and running on port: ${port}`);
})