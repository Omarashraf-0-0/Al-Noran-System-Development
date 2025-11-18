const mongoose = require('mongoose');
require('dotenv').config();

const Shipment = require('../src/models/shipment');
const User = require('../src/models/user');

// حالات الشحنة المتاحة في الـ schema
const statuses = [
	'Pending',                   // 1 - قيد الانتظار
	'في انتظار الشحن',          // 2
	'In Transit',                // 3 - في الطريق
	'Arrived',                   // 4 - تم وصول البضاعة
	'في انتظار وصول الإذن',     // 5
	'Customs Clearance',         // 6 - التخليص الجمركي
	'جاري الكشف والتثمين',      // 7
	'Completed',                 // 8 - مكتملة
	'تمت بنجاح'                 // 9
];

async function createTestShipments() {
	try {
		await mongoose.connect(process.env.DATABASE_URI);
		console.log('✅ Connected to MongoDB\n');

		// Find xiiMody user
		const user = await User.findOne({ username: 'xiiMody' });
		if (!user) {
			console.log('❌ User xiiMody not found!');
			return;
		}
		console.log(`✅ Found user: ${user.username} (${user.email})\n`);

		// Find an employee (any employee)
		const employee = await User.findOne({ type: 'employee' });
		if (!employee) {
			console.log('⚠️ No employee found, using user as employee');
		}
		const employeeId = employee ? employee._id : user._id;

		const shipments = [];

		// Create 9 shipments - one for each status
		for (let i = 0; i < statuses.length; i++) {
			const status = statuses[i];
			const acidNumber = String(i + 1).padStart(3, '0');
			
			const shipment = {
				user_id: user._id,
				employee_id: employeeId,
				acid: `ACD-2025-${acidNumber}`,
				port_name: ['Port Said', 'Alexandria Port', 'Jeddah Port', 'Dubai Port'][i % 4],
				country: ['مصر', 'السعودية', 'الإمارات', 'قطر'][i % 4],
				num_of_containers: (i % 3) + 1,
				type_of_containers: [['20ft'], ['40ft'], ['20ft', '40ft']][i % 3],
				third_gomroky: i % 2 === 0 ? ['المنطقة الجمركية أ'] : [],
				status: status,
				policy: `Policy-${acidNumber}`,
				dragt: i % 2 === 0,
				clearance_fees: 5000 + (i * 1000),
				expenses_and_tips: 500 + (i * 100),
				sundries: 200 + (i * 50),
				importerName: `شركة ${user.fullname}`,
				number46: `${40 + i}/2025`,
				employerName: 'شركة النوران للشحن',
				shipmentDescription: [
					'ملابس وأحذية',
					'أجهزة إلكترونية',
					'أثاث منزلي',
					'مواد غذائية',
					'قطع غيار سيارات',
					'أدوات كهربائية',
					'ألعاب أطفال',
					'مستحضرات تجميل',
					'كتب ومجلات'
				][i],
				arrivalDate: new Date(Date.now() + (i * 86400000)), // Each day apart
				invoiceUrl: `/uploads/shipments/ACD-2025-${acidNumber}-invoice.pdf`,
				requiredDocuments: []
			};

			// Add required documents to some shipments (not all)
			if (i % 3 === 0) {
				// Shipment with uploaded documents
				shipment.requiredDocuments = [
					{
						name: 'بوليصة',
						uploaded: true,
						requestedAt: new Date(),
						fileId: new mongoose.Types.ObjectId(),
						uploadedAt: new Date()
					},
					{
						name: 'فاتورة',
						uploaded: true,
						requestedAt: new Date(),
						fileId: new mongoose.Types.ObjectId(),
						uploadedAt: new Date()
					}
				];
			} else if (i % 3 === 1) {
				// Shipment with missing documents
				shipment.requiredDocuments = [
					{
						name: 'بوليصة',
						uploaded: false,
						requestedAt: new Date()
					},
					{
						name: 'فاتورة',
						uploaded: false,
						requestedAt: new Date()
					},
					{
						name: 'شهادة المنشأ',
						uploaded: false,
						requestedAt: new Date()
					}
				];
			}
			// i % 3 === 2 will have no documents

			shipments.push(shipment);
		}

		// Create additional shipments for variety
		// Shipment with many documents
		shipments.push({
			user_id: user._id,
			employee_id: employeeId,
			acid: 'ACD-2025-010',
			port_name: 'Port Said',
			country: 'مصر',
			num_of_containers: 5,
			type_of_containers: ['20ft', '20ft', '40ft', '40ft', '45ft'],
			third_gomroky: ['المنطقة الجمركية ب', 'المنطقة الجمركية ج'],
			status: 'في الطريق',
			policy: 'Policy-010',
			dragt: false,
			clearance_fees: 25000,
			expenses_and_tips: 3500,
			sundries: 1200,
			importerName: `شركة ${user.fullname}`,
			number46: '50/2025',
			employerName: 'شركة النوران للشحن',
			shipmentDescription: 'شحنة كبيرة - معدات صناعية',
			arrivalDate: new Date(Date.now() + (10 * 86400000)),
			invoiceUrl: '/uploads/shipments/ACD-2025-010-invoice.pdf',
			requiredDocuments: [
				{ name: 'بوليصة', uploaded: true, requestedAt: new Date(), fileId: new mongoose.Types.ObjectId(), uploadedAt: new Date() },
				{ name: 'فاتورة', uploaded: true, requestedAt: new Date(), fileId: new mongoose.Types.ObjectId(), uploadedAt: new Date() },
				{ name: 'شهادة المنشأ', uploaded: false, requestedAt: new Date() },
				{ name: 'رخصة استيراد', uploaded: false, requestedAt: new Date() },
				{ name: 'شهادة صحية', uploaded: false, requestedAt: new Date() }
			]
		});

		// Insert all shipments
		const result = await Shipment.insertMany(shipments);
		console.log(`✅ Created ${result.length} test shipments!\n`);

		// Show summary
		console.log('📦 Shipments Summary:\n');
		console.log('─'.repeat(80));
		result.forEach((ship, index) => {
			console.log(`${index + 1}. ACID: ${ship.acid} | Status: ${ship.status} | Docs: ${ship.requiredDocuments?.length || 0}`);
		});
		console.log('─'.repeat(80));

		await mongoose.connection.close();
		console.log('\n✅ Done! Test data created successfully!');
	} catch (error) {
		console.error('❌ Error:', error);
		process.exit(1);
	}
}

createTestShipments();
