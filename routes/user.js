const express=require('express');
const multer=require('multer');
const sharp=require('sharp');
const User=require('../models/user');
const {sendWelcomeEmail,sendCancelationEmail}=require('../utils/mail');
const auth=require('../middlewares/auth');
const router=new express.Router();

router.get('/',(req,res)=>{
    res.send('task');
})

router.post('/',async(req,res)=>{
    const user=new User(req.body);
    try{
        await user.save();
        sendWelcomeEmail(user.email,user.name);
        user.generateAuthToken();
        res.status(200).send(user);
    }
    catch(e){
        console.log(e);
        res.status(400).send(e);
    }
})

router.post('/login',async(req,res)=>{
    try{
        const user=await User.findByCredentials(req.body.email,req.body.password);

        const token=await user.generateAuthToken();
        res.send({user,token});
    }
    catch(e){
        console.log(e);
        res.status(400).send(e);
    }
})

router.post('/logout',auth,async (req,res)=>{
    try{
        req.user.tokens=req.user.tokens.filter((token)=>{
            return token.token!==req.token
        })
        await req.user.save();
        res.status(200).send(`${req.user.name} is logged out now!`);
    }
    catch(e){
        console.log(e);
        res.status(500).send(e);
    }
})

router.post('/logoutAll',auth,async (req,res)=>{
    try{
        req.user.tokens=[];
        await req.user.save();
        res.status(200).send('logged out of all devices');
    }
    catch(e){
        console.log(e);
        res.status(500).json(e);
    }
})

router.get('/me',auth,(req,res)=>{
    res.send(req.user);
})

router.patch('/me',auth,async (req,res)=>{
    const updates=Object.keys(req.body);
    const allowedUpdates=['name','email','password','age'];

    const isValidOperation=updates.every((update)=>allowedUpdates.includes(update));

    if(!isValidOperation){
        return res.status(400).send({error:'Invalid updates!'});
    }
    try{
        updates.forEach((update)=>req.user[update]=req.body[update]);
        await req.user.save();
        res.send(req.user);

    }
    catch(e){
        console.log(e);
        res.status(400).send(e);

    }
})

router.delete('/me',auth,async(req,res)=>{
    try{
        
        await req.user.remove();
        sendCancelationEmail(req.user.email,req.user.name);
        res.send(req.user);
    }
    catch(e){
        console.log(e);
        res.status(500).send(e);
    }
})


const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'))
        }

        cb(undefined, true)
    }
})


//form-data me jake key->avatar and value->>file
router.post('/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer;
    console.log(buffer);
    await req.user.save()
    res.send('avatar updated')
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})


router.delete('/me/avatar',auth,async (req,res)=>{
    req.user.avatar=undefined;
    await req.user.save();
    res.send('avatar deleted');
})

router.get('/:id/avatar',async(req,res)=>{
    try{
        const user=await User.findById(req.params.id);

        if(!user || !user.avatar){
            throw new Error();
        }

        res.set('Content-Type','image/png');
        res.send(user.avatar);
    }
    catch(e){
        res.status(400).send(e);
    }
})



module.exports=router;