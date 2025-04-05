const MeetingHistory = require('../../model/schema/meeting')
const mongoose = require('mongoose');

const add = async (req, res) => {
   console.debug('req.body',req.body);
    try {
        const { agenda , attendes, attendesLead , createBy , dateTime , location, notes , related } = req.body;
       
        console.log('dataq',req.body);
     
        // Check if the user exists
        const newMeeting = new MeetingHistory({
            agenda: agenda,
            attendes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }],
            attendesLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
            createBy: mongoose.Types.ObjectId(createBy),
            dateTime: dateTime.toString(),
            location: location,
            notes: notes,
            related: related,
            timestamp: new Date(),
            deleted: false,
        });
        const savedMeeting = await newMeeting.save();
        if (!savedMeeting) {
            return res.status(400).json({ error: 'Failed to save meeting' });
        }
        res.status(201).json(savedMeeting);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const index = async (req, res) => {
    meetingData = [
        {
          "agenda": "Quarterly Strategy Planning",
          "attendes": ["Alice Johnson", "Bob Smith"],
          "attendesLead": [],
          "location": "Head Office - Boardroom A",
          "related": "Contact",
          "dateTime": "2025-04-08T10:30:00Z",
          "notes": "Review performance and set Q2 objectives.",
          "createBy": "Sophia Green",
          "timestamp": "2025-04-01T09:00:00Z",
          "deleted": false
        },
        {
          "agenda": "Product Demo for Alpha Group",
          "attendes": [],
          "attendesLead": ["Alpha Group Inc.", "Beta Tech Solutions"],
          "location": "Microsoft Teams",
          "related": "Lead",
          "dateTime": "2025-04-10T15:00:00Z",
          "notes": "Demo version 2.1 with updated features.",
          "createBy": "Liam Patel",
          "timestamp": "2025-04-02T14:20:00Z",
          "deleted": false
        },
        {
          "agenda": "Marketing Sync-up",
          "attendes": ["Emma Watson"],
          "attendesLead": [],
          "location": "Zoom",
          "related": "Contact",
          "dateTime": "2025-04-12T11:00:00Z",
          "notes": "Align marketing roadmap with product team.",
          "createBy": "Noah Lee",
          "timestamp": "2025-04-03T08:45:00Z",
          "deleted": false
        },
        {
          "agenda": "Investor Update Call",
          "attendes": ["Mason Clark", "Olivia Brown"],
          "attendesLead": [],
          "location": "Google Meet",
          "related": "Contact",
          "dateTime": "2025-04-14T17:00:00Z",
          "notes": "Share financials and roadmap.",
          "createBy": "Ava White",
          "timestamp": "2025-04-03T12:10:00Z",
          "deleted": false
        },
        {
          "agenda": "Lead Qualification Follow-up",
          "attendes": [],
          "attendesLead": ["Gamma Enterprises"],
          "location": "Call",
          "related": "Lead",
          "dateTime": "2025-04-16T13:45:00Z",
          "notes": "Discuss use cases and conversion criteria.",
          "createBy": "Ethan Nguyen",
          "timestamp": "2025-04-04T10:15:00Z",
          "deleted": false
        }
      ]
      
      
      
      
    
    try {
        const meetings = meetingData ;
        res.status(200).json(meetings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const view = async (req, res) => {
    
    try {
        const { id } = req.params;
        const meeting = await MeetingHistory.findById(id);
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }
        res.status(200).json(meeting);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const deleteData = async (req, res) => {
  
    try {
        const { id } = req.params;
        const meeting = await MeetingHistory.findByIdAndDelete(id);
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }
        res.status(200).json({ message: 'Meeting deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
    
}

const deleteMany = async (req, res) => {
    
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Invalid request data' });
        }
        const meetings = await MeetingHistory.deleteMany({ _id: { $in: ids } });
        res.status(200).json({ message: 'Meetings deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { add, index, view, deleteData, deleteMany }