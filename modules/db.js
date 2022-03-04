const mongoose = require('mongoose');

// Settings

const dbURI = process.env.DB_URI;
const dbConnection = mongoose.createConnection(dbURI, { useNewUrlParser: true });

// Default Statements

const Schema = mongoose.Schema;

// Schemas

const teeSchema = new Schema({
    name: String,
    category: Number,
    types: Array
});

const teeTypeSchema = new Schema({
    name: String
});

const optionSchema = new Schema({
    name: String,
    data: Object
});

const userSchema = new Schema({
    userId: Number,
    nickname: String,
    firstName: String,
    lastName: String,
    lastChanceToggle: Boolean,
    notifications: {
        variation: String,
        general: Boolean,
        generalEnabledAt: Number,
        specials: Boolean,
        specialsEnabledAt: Number,
    }
});

// Models

const Tee = dbConnection.model('Tee', teeSchema, 'tees');
const TeeType = dbConnection.model('TeeType', teeTypeSchema, 'teeTypes');
const User = dbConnection.model('User', userSchema, 'users');
const Option = dbConnection.model('Option', optionSchema, 'options');

// Functions

async function getTees() {
    return await Tee.find({}, function(error, tees) {
        if (error) {
            console.log(error);
        }
        return tees;
    });
}

async function getTeeTypes() {
    return await TeeType.find({}, async function (error, teeTypes) {
        if (error) {
            console.log(error);
        }
        return teeTypes;
    });
}

async function getUser(user) {
    return await User.find({ userId: user.id }, function (error, foundUser) {
        if (error) {
            console.log(error);
        }
        return foundUser;
    });
}

async function getUsers() {
    return await User.find({}, function (error, users) {
        if (error) {
            console.log(error);
        }
        return users;
    });
}

async function saveTee(receivedTee, teeCategory) {
    const tee = new Tee({
        name: receivedTee.name,
        category: teeCategory,
        types: receivedTee.types
    });
    await tee.save()
        .then(() => console.log(`Tee ${receivedTee.name} saved!`))
        .catch(error => console.log(error));
}

async function saveTeeType(name) {
    const teeType = new TeeType({ name });
    await teeType.save()
        .then(() => console.log(`Tee type ${ name } saved!`))
        .catch(error => console.log(error));
}

async function saveUser(user) {
    const newUser = new User({
        userId: user.id,
        nickname: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        lastChanceToggle: false,
        notifications: {
            variation: 'zoom',
            $schema: true,
            general: true,
            generalEnabledAt: Date.now(),
            specials: true,
            specialsEnabledAt: Date.now(),
        }
    });

    await newUser.save()
        .then(() => console.log(`New user ${user.first_name} saved!`))
        .catch(error => console.log(error));
}

async function clearTeesData() {
    var teeList = await dbConnection.db.listCollections({ name: 'tees' }).toArray();
    var teeTypeList = await dbConnection.db.listCollections({ name: 'teeTypes' }).toArray();
    if (teeList.length > 0) {
        await dbConnection.dropCollection('tees')
            .then(() => console.log('Tees deleted!'))
            .catch(error => console.log(error));
    }
    if (teeTypeList.length > 0) {
        await dbConnection.dropCollection('teeTypes')
            .then(() => console.log('Tee types deleted!'))
            .catch(error => console.log(error));
    }
}

async function updateUser(user, param, value) {
    await User.findOne({ userId: user.id }, async function (error, foundUser) {
        if (error) {
            console.log(error);
        } else {
            foundUser.set(param, value);
            await foundUser.save();
        }
    });
}

async function updateSaveDate() {
    await Option.findOne({ name: 'Last Update' }, async function (error, option) {
        if (!option) {
            await Option.create({ name: 'Last Update', data: Date.now() }, function (error) {
                if (error) {
                    console.log(error);
                }
            })
        } else {
            option.set('data', Date.now());
            await option.save();
        }
        console.log('Date updated!');
    });
}

function finish() {
    mongoose.disconnect();
}

module.exports = {
    Option,
    getTees, getTeeTypes, getUser, getUsers,
    saveTee, saveTeeType, saveUser,
    clearTeesData,
    updateUser, updateSaveDate,
    finish
};