const express=require('express');
const Task=require('../models/task');
const auth=require('../middlewares/auth');
const { findOneAndDelete } = require('../models/task');
const router=new express.Router();


router.post('/',auth,async(req,res)=>{
    const task=new Task({
        ...req.body,
        owner:req.user._id
    })
    try{
        await task.save();
        res.status(201).send(task);
    }
    catch(e){
        res.status(400).send(e);
    }
})


// GET /tasks?completed=true ->>filtering/matching
// GET /tasks?limit=10&skip=20 ->>Pagination
// GET /tasks?sortBy=createdAt:desc ->>sorting
router.get('/',auth,async (req,res)=>{
    const match={};
    const sort={};

    if(req.query.completed){
        match.completed=req.query.completed==='true';
    }

    if(req.query.sortBy){
        const parts=req.query.sortBy.split(':');
        sort[parts[0]]=parts[1]=='desc'?-1:1;
    }
     
    try{
        await req.user.populate({
            path:'tasks',
            match,
            options:{
                limit:parseInt(req.query.limit),
                skip:parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        if(!req.user.tasks)
        {
            res.status(400).send('No tasks');
        }
        res.status(200).send(req.user.tasks);
    }
    catch(e)
    {
        res.status(500).send();
    }
})


router.get('/:id',auth,async (req,res)=>{
    const _id=req.params.id;
    try{
        const task=await Task.findOne({_id,owner:req.user._id});
        if(!task){
            return res.status(404).send('No task found!');
        }
        res.status(200).send(task);
    }
    catch(e){
        res.status(500).send(e);
    }
})

router.patch('/:id',auth,async (req,res)=>{
    const updates=Object.keys(req.body);
    const allowedUpdates=['description','completed'];

    const isValidOperation=updates.every((update)=>allowedUpdates.includes(update));
    if(!isValidOperation){
        return res.status(400).send({error:'Invalid Updates'});
    }

    try{
        const task=await findOne({_id:req.params.id,owner:req.user._id});
        if(!task){
            return res.status(404).send('Task not found for the user');
        }
        updates.forEach((update)=>{
            task[update]=req.body[update];
        })
        await task.save();
        res.status(200).send(task);
    }
    catch(e){
        res.status(400).send(e);
    }
})

router.delete('/:id',auth,async (req,res)=>{
    try{
        const task=await findOneAndDelete({_id:req.params.id,owner:req.user._id});
        if(!task){
            res.status(404).send('Task Not found for this user');
        }

        res.status(200).send(task);
    }
    catch(e){
        res.status(500).send(e);
    }
})

module.exports=router;