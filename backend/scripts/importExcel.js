const mongoose = require('mongoose');
const xlsx = require('xlsx');
const Member = require('../models/Member');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const excelPath = path.join(__dirname, '../../BN FAMILY TREE.xlsx');

async function importData() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/familytree');
    console.log('MongoDB connected for import');

    // Check if data already exists
    const count = await Member.countDocuments();
    if (count > 0) {
      console.log('Data already exists, skipping import...');
      process.exit(0);
    }

    const wb = xlsx.readFile(excelPath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Initial mapping algorithm based on headers
    // Given the non-standard structure, we will just bring them in as flat members 
    // and attempt to extract Name, DOB, etc.
    // The user can map relationships via the UI Edit feature.
    
    // We'll store parsed members in memory first, then link them, then save.
    const memberDocs = [];
    const membersByWrt = {}; // e.g. "Son-1" -> memberDoc
    
    // First Pass: Create members
    for (const row of data) {
      let name = row['MY FATHER'] || row['MY MOTHER'] || row['Prafulla series'] || row['Shanta Series'] || row['Pradipta Series'] || row['Mahasweta Series'] || row['Prasanta Series'] || row['Pradyumna Series'] || row['Prabodh Series'];
      if (!name || name === 'ZZ' || name === 'zzz') {
        name = 'Unknown Member';
      }

      let dob = null;
      if (row['DATE OF BIRTH']) {
        const parsedDob = new Date(row['DATE OF BIRTH']);
        if (!isNaN(parsedDob.getTime())) dob = parsedDob;
      } else if (row['BN ADMSN DATE  ']) {
        const parsedDob = new Date(row['BN ADMSN DATE  ']);
        if (!isNaN(parsedDob.getTime())) {
             dob = parsedDob;
        } else {
             dob = new Date();
             dob.setFullYear(row['BN ADMSN DATE  ']); 
             if (isNaN(dob.getTime())) dob = null;
        }
      }

      let marriageDate = null;
      if (row['MARRIAGE DATE'] && !isNaN(new Date(row['MARRIAGE DATE']).getTime())) {
          marriageDate = new Date(row['MARRIAGE DATE']);
      }
      
      let deathDate = null;
      if (row['DATE OF DEATH'] && !isNaN(new Date(row['DATE OF DEATH']).getTime())) {
          deathDate = new Date(row['DATE OF DEATH']);
      }

      const wrt = row['wrt MY PARENTS'] ? row['wrt MY PARENTS'].toString().trim() : '';

      const member = new Member({
        name: name,
        nickname: '',
        gender: wrt.toLowerCase().includes('daughter') || wrt.toLowerCase().includes('wife') || wrt.toLowerCase().includes('mother') ? 'Female' : 'Male', // Basic inference
        details: {
          phone: row['wapp#'] !== 'ZZ' && row['wapp#'] !== 'zzz' ? String(row['wapp#']) : '',
          email: row['email add'] !== 'ZZ' && row['email add'] !== 'zzz' ? row['email add'] : '',
          address: row['ADDRESS'] || '',
          dob: dob ? dob.toISOString().slice(0, 10) : '',
          marriageDate: marriageDate ? marriageDate.toISOString().slice(0, 10) : '',
          qualification: row['QUALIFICATION'] || '',
          profession: row['ENGAGEMENT'] || '',
          dateOfDeath: deathDate ? deathDate.toISOString().slice(0, 10) : ''
        },
        spouses: [],
        children: [],
        parents: [],
      });

      memberDocs.push({ member, wrt, row });
      if (wrt) {
        membersByWrt[wrt] = member;
      }
    }

    // Second Pass: Link Parents and Spouses
    const father = membersByWrt['Father'];
    const mother = membersByWrt['Mother'];
    
    if (father && mother) {
      father.spouses.push(mother._id);
      mother.spouses.push(father._id);
    }

    // Helper to find parent by series
    const guessParentBySeries = (row) => {
        if (row['Prafulla series'] && row['Prafulla series'] !== 'zzz') return membersByWrt['Son-1'];
        if (row['Shanta Series'] && row['Shanta Series'] !== 'zzz') return membersByWrt['Daughter-1'];
        if (row['Pradipta Series'] && row['Pradipta Series'] !== 'zzz') return membersByWrt['Son-2'];
        if (row['Mahasweta Series'] && row['Mahasweta Series'] !== 'zzz') return membersByWrt['Daughter-2'];
        if (row['Prasanta Series'] && row['Prasanta Series'] !== 'zzz') return membersByWrt['Son-3'];
        if (row['Pradyumna Series'] && row['Pradyumna Series'] !== 'zzz') return membersByWrt['Son-4'];
        if (row['Prabodh Series'] && row['Prabodh Series'] !== 'zzz') return membersByWrt['Son-5'];
        return null; // default to father if root
    };

    memberDocs.forEach(docObj => {
      const { member, wrt, row } = docObj;
      
      // Handle Roots
      if (wrt === 'Father' || wrt === 'Mother' || wrt === 'Wife') return;
      
      const wrtLower = wrt.toLowerCase();

      // Check for Son/Daughter of Root
      if (wrtLower.match(/^son-\d+$/) || wrtLower.match(/^daughter-\d+$/)) {
         if (father) member.parents.push(father._id);
         if (mother) member.parents.push(mother._id);
         if (father) father.children.push(member._id);
         if (mother) mother.children.push(member._id);
      }
      
      // Check for Spouses of level 1 (In-Laws)
      else if (wrtLower.match(/in-?law/)) {
         // e.g. Daughter-In-Law-1 wife of Son-1
         const numMatch = wrtLower.match(/\d+[a-z]?/);
         if (numMatch) {
            const num = numMatch[0];
            let spouseWrt = wrtLower.includes('daughter') ? `Son-${num}` : `Daughter-${num}`;
            // Clean 'a' or 'b' for multiple wives
            spouseWrt = spouseWrt.replace(/[a-z]/g, ''); 
            const spouse = membersByWrt[spouseWrt] || membersByWrt[`Son-${num}`] || membersByWrt[`Daughter-${num}`];
            
            if (spouse) {
               member.spouses.push(spouse._id);
               if (!spouse.spouses.includes(member._id)) {
                   spouse.spouses.push(member._id);
               }
            }
         }
      } 
      // Grandchildren and beyond
      else if (wrtLower.includes('grandson') || wrtLower.includes('granddaughter') || wrtLower.includes('son') || wrtLower.includes('daughter')) {
         const parent = guessParentBySeries(row);
         if (parent) {
             member.parents.push(parent._id);
             parent.children.push(member._id);
             
             // If parent has a spouse, link from both
             if (parent.spouses && parent.spouses.length > 0) {
                 member.parents.push(parent.spouses[0]); // Best guess first spouse
                 const spouseDoc = memberDocs.find(d => d.member._id.toString() === parent.spouses[0].toString());
                 if (spouseDoc) {
                     spouseDoc.member.children.push(member._id);
                 }
             }
         }
      }
    });

    // Save all to DB
    for (const docObj of memberDocs) {
      await docObj.member.save();
    }

    console.log('Import successful');
    process.exit(0);
  } catch (err) {
    console.error('Import failed:', err);
    process.exit(1);
  }
}

importData();
