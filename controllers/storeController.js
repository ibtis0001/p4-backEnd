const mongoose = require('mongoose');
const Store = mongoose.model('Store');
// mongoose.Promise = global.Promise;
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');
const User = mongoose.model('User');


const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter(req, file, next){
        const isPhoto = file.mimetype.startsWith('image/');
        if(isPhoto){
            next(null, true);
        }else{
            next({ message: 'that file type is not allowed!' }, false);
        }
    }
};


exports.homePage=(req, res) => {
    // console.log(req.name); 
res.render  ('index')
}



exports.addStore=(req, res)=>{
    res.render('editStore', {title: 'Add Store'})
}

exports.upload = multer(multerOptions).single('photo'); 

exports.resize = async (req, res, next)=>{
if(!req.file){
    next();
    return;
}
// console.log(req.file);
const extension = req.file.mimetype.split('/')[1];
req.body.photo = `${uuid.v4()}.${extension}`;
const photo = await jimp.read(req.file.buffer);
await photo.resize(800, jimp.AUTO);
await photo.write(`./public/uploads/${req.body.photo}`);
next();
};

exports.createStore = async (req, res) => {

req.body.author = req.user._id;
const store = await (new Store(req.body)).save();
 req.flash('success', `Successfully Created ${store.name}.`)
res.redirect(`/store/${store.slug}`);

    // const store = new Store(req.body);
    // await store.save();
    // res.redirect('/');
      console.log('it is workkkking!!!data is saved');
}


exports.getStores = async (req, res)=>{
    const stores = await Store.find();
    res.render('stores', {title: 'Stores', stores})
}

const confirmOwner = (store, user) =>{
    if(!store.author.equals(user._id)){
        throw Error('you must own a store in order to edit it')
    }
}; 

exports.editStore = async (req, res)=>{
const store = await Store.findOne({ _id: req.params.id });
confirmOwner(store, req.user);
// res.json(store);
res.render('editStore', { title: `Edit ${store.name}`, store })

    // res.json(req.params);
}



exports.updateStore = async (req, res)=>{
    req.body.location.type ='Point';
    const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true, runValidators: true}).exec();
        req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/store/${store.slug}">View store → </a>`);
        res.redirect(`/stores/${store.id}/edit`)
}

exports.getStoreBySlug = async (req,res, next)=>{
    // res.send('u r awesome');
    const store = await Store.findOne({ slug: req.params.slug }).populate('author');
    // res.json(store)
    if(!store){
        return next();
    }
    res.render('store', { store: store, title: store.name });
}


exports.getStoresByTag = async (req, res)=>{
    // res.send('works u lovely!!');
    const tag = req.params.tag;
    const tagQuery = tag || { $exists: true };
    const tagsPromise = Store.getTagsList();
    const storesPromise = Store.find({tags: tagQuery});
    const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
    // res.json(tags);
    // res.json(stores);
    res.render('tag', { tags: tags, title: 'Tags', tag, stores });

};


exports.searchStores= async (req, res)=>{
    // res.json(req.query);
    const stores = await Store
    .find({
        $text: {
        $search: req.query.q 
        }
    }, {
        score: { $meta: 'textScore' }
    })
    .sort({
      score: { $meta: 'textScore' }  
    })
    .limit(5);
    res.json(stores)
};

exports.heartStore = async (req, res)=>{
    const hearts = req.user.hearts.map(obj => obj.toString());
    // console.log(hearts);
    const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
    const user = await User.findByIdAndUpdate(req.user._id,
        { [operator]: { hearts: req.params.id } },
        { new: true }
        );
    // res.json(hearts)
    res.json(user)

    
};

exports.getHearts = async (req,res)=>{
    const stores = await Store.find({
        _id: { $in: req.user.hearts }
    });
    // res.json(stores);
    res.render('stores', { title: 'hearted stores', stores: stores });
};



exports.mapStores = async (req, res)=>{
    // res.json({ is: 'woohoo!!!!!!' })
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
    // res.json(coordinates);
    const q = {
        location:{
            $near: { 
                $geometry: {
                    type: 'Point',
                    coordinates
                },
                $maxDistance: 10000 //10km
             }
        }
    };

    const stores = await Store.find(q).select('slug name description location photo').limit(10);
    res.json(stores)
    
};


exports.mapPage = async (req,res)=>{
    res.render('map', { title: 'map' })
};




