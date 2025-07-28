const mongoose = require('mongoose');
const config = require("fine-packages");
const { Lead } = require('../../model/schema/lead')
const { Contact } = require('../../model/schema/contact')
const email = require('../../model/schema/email');
const User = require('../../model/schema/user')
const PhoneCall = require('../../model/schema/phoneCall');
const { Property } = require('../../model/schema/property')
const TextMsg = require('../../model/schema/textMsg');
const Task = require('../../model/schema/task')
const MeetingHistory = require('../../model/schema/meeting');
// const user = require('../../model/schema/user');
const customField = require('../../model/schema/customField');
const Account = require('../../model/schema/account');
const EmailTemp = require('../../model/schema/emailTemplate')
const Opprtunities = require('../../model/schema/opprtunity')
const Invoices = require("../../model/schema/invoices.js");
const Quotes = require("../../model/schema/quotes.js");
const ModuleActiveDeactive = require('../../model/schema/moduleActiveDeactive.js');



// Reusable function to fetch and filter data
const fetchData = async (Model, query, populateField) => {
    const data = await Model.find(query).populate({
        path: populateField,
        match: { deleted: false }
    }).exec();
    return data.filter(item => item?.[populateField] !== null);
};

// Reusable function for aggregation
const aggregateData = async (Model, matchFilter, groupFields) => {
    return await Model.aggregate([
        { $match: matchFilter },
        { $lookup: { from: 'Contacts', localField: 'createBy', foreignField: '_id', as: 'contact' } },
        { $unwind: { path: '$contact', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'Leads', localField: 'createByLead', foreignField: '_id', as: 'lead' } },
        { $unwind: { path: '$lead', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'User', localField: 'sender', foreignField: '_id', as: 'users' } },
        { $unwind: { path: '$users', preserveNullAndEmptyArrays: true } },
        { $match: { 'contact.deleted': { $ne: true }, 'users.deleted': { $ne: true }, 'lead.deleted': { $ne: true } } },
        { $group: { _id: groupFields, count: { $sum: 1 }, id: { $first: '$_id' } } },
        { $sort: { '_id.year': -1, '_id.month': 1, '_id.day': -1 } }
    ]);
};

// Index function
const index = async (req, res) => {
    try {
        const query = { ...req.query, deleted: false };
        const result = await User.find(query);
        res.send(result);
    } catch (err) {
        console.error('Error in index:', err);
        res.status(500).send({ error: 'Failed to fetch data' });
    }
};

// Line chart function
const lineChart = async (req, res) => {
    try {
        const query = { ...req.query, deleted: false };
        const senderQuery = { ...query };

        if (query.createdBy) {
            query.createdBy = new mongoose.Types.ObjectId(query.createdBy);
            senderQuery.sender = new mongoose.Types.ObjectId(query.createdBy);
        }

        // Fetch data in parallel
        const [
            leadData, contactData, propertyData, taskData, meetingHistoryData,
            emailData, phoneCallData, AccountData, EmailTempData,
            OpprtunitiesData, InvoicesData, QuotesData
        ] = await Promise.all([
            fetchData(Lead, query, 'createBy'),
            fetchData(Contact, query, 'createBy'),
            fetchData(Property, query, 'createBy'),
            fetchData(Task, query, 'createBy'),
            fetchData(MeetingHistory, query, 'createBy'),
            fetchData(email, senderQuery, 'sender'),
            fetchData(PhoneCall, senderQuery, 'sender'),
            fetchData(Account, senderQuery, 'createBy'),
            fetchData(EmailTemp, senderQuery, 'createBy'),
            fetchData(Opprtunities, senderQuery, 'createBy'),
            fetchData(Invoices, senderQuery, 'createBy'),
            fetchData(Quotes, senderQuery, 'createBy')
        ]);

        const userDetails = await User.findOne({ _id: req.user.userId }).populate({ path: 'roles' });
        const fields = await customField.find({ deleted: false });

        const mergedRoles = userDetails?.roles?.reduce((acc, current) => {
            current?.access?.forEach(permission => {
                const existingPermissionIndex = acc.findIndex(item => item.title === permission.title);
                if (existingPermissionIndex !== -1) {
                    const updatedPermission = { ...acc[existingPermissionIndex] };
                    Object.keys(permission).forEach(key => {
                        if (permission[key] === true) {
                            updatedPermission[key] = true;
                        }
                    });
                    acc[existingPermissionIndex] = updatedPermission;
                } else {
                    acc.push(permission);
                }
            });
            return acc;
        }, []);

        const modules = [
            { name: "Leads", data: leadData, color: "red" },
            { name: "Contacts", data: contactData, color: "blue" },
            { name: "Properties", data: propertyData, color: "green" },
            { name: "Opportunities", data: OpprtunitiesData, color: "linkedin" },
            { name: "Account", data: AccountData, color: "teal" },
            { name: "Quotes", data: QuotesData, color: "blackAlpha" },
            { name: "Invoices", data: InvoicesData, color: "linkedin" },
            { name: "Tasks", data: taskData, color: "pink" },
            { name: "Meetings", data: meetingHistoryData, color: "purple" },
            { name: "Calls", data: phoneCallData, color: "cyan" },
            { name: "Emails", data: emailData, color: "yellow" },
            { name: "Email Template", data: EmailTempData, color: "orange" }
        ];

        let result = modules.map(module => ({
            name: module.name,
            length: module.data?.length || 0,
            color: module.color
        }));

        if (mergedRoles && mergedRoles.length > 0) {
            result = result.filter(item => {
                const role = mergedRoles.find(role => role.title === item.name);
                return role ? role.view !== false : true;
            });
        } else if (userDetails?.role === "superAdmin") {
            for (const item of fields) {
                if (!result.find(i => i.name === item.moduleName)) {
                    const ExistingModel = mongoose.model(item.moduleName);
                    const allData = await ExistingModel.find({ deleted: false });
                    const colorIndex = result.length % modules.length;
                    const color = modules[colorIndex].color;

                    result.push({
                        name: item.moduleName,
                        length: allData.length,
                        color: color
                    });
                }
            }
        } else {
            result = [];
        }

        const moduleData = await ModuleActiveDeactive.find({ isActive: true });
        const activeModules = moduleData.map(item => item.moduleName);
        const activeModulesReport = result.filter(item => activeModules.includes(item.name));

        res.send(activeModulesReport);
    } catch (err) {
        console.error('Error in lineChart:', err);
        res.status(500).send({ error: 'Failed to fetch line chart data' });
    }
};

// Data function
const data = async (req, res) => {
    try {
        const { startDate: startDateString, endDate: endDateString, filter } = req.body;

        const startDate = new Date(startDateString);
        const endDate = new Date(endDateString);
        if (isNaN(startDate) || isNaN(endDate)) {
            return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD.' });
        }
        endDate.setHours(23, 59, 59, 999);

        const matchFilter = { timestamp: { $gte: startDate, $lte: endDate } };
        if (req.query.sender) {
            matchFilter.sender = new mongoose.Types.ObjectId(req.query.sender);
        }

        const groupFields = {
            year: { $year: "$timestamp" },
            month: { $month: "$timestamp" },
            ...(filter === "day" && { day: { $dayOfMonth: "$timestamp" } }),
            ...(filter === "week" && { week: { $week: "$timestamp" } })
        };

        const [Email, Call, TextSent] = await Promise.all([
            aggregateData(email, matchFilter, groupFields),
            aggregateData(PhoneCall, matchFilter, groupFields),
            aggregateData(TextMsg, matchFilter, groupFields)
        ]);

        if (!Email.length && !Call.length && !TextSent.length) {
            res.status(200).json({ totalEmails: 0, totalCall: 0, totalTextSent: 0 });
        } else {
            res.status(200).json({ Email, Call, TextSent });
        }
    } catch (err) {
        console.error('Error in data:', err);
        res.status(500).send({ error: 'Failed to fetch data' });
    }
};

module.exports = { index, lineChart, data };