/**
 * اختبار نظام الإشعارات
 * يقوم بإرسال إشعارات اختبارية لكل نوع من أنواع الإشعارات
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const notificationService = require('../src/services/notificationService');
const User = require('../src/models/user');

async function testNotifications() {
    console.log('🧪 بدء اختبار نظام الإشعارات...\n');
    
    await mongoose.connect(process.env.DATABASE_URI);
    console.log('✅ متصل بقاعدة البيانات\n');
    
    // Find a user with FCM token
    const user = await User.findOne({ fcmToken: { $exists: true, $ne: null, $ne: "" } });
    
    if (!user) {
        console.log('❌ لا يوجد مستخدم بـ FCM Token');
        console.log('   يرجى تسجيل الدخول من التطبيق أولاً لتسجيل الـ Token\n');
        await mongoose.disconnect();
        return;
    }
    
    console.log(`👤 المستخدم المختار: ${user.username} (${user._id})`);
    console.log(`📱 FCM Token: ${user.fcmToken.substring(0, 40)}...\n`);
    
    const results = [];
    
    // Test 1: ACID - بدء المراجعة
    console.log('📝 اختبار 1: ACID - بدء المراجعة');
    try {
        await notificationService.createNotification({
            userId: user._id,
            type: "acid_reviewing",
            message: "اختبار: طلب ACID الخاص بك قيد المراجعة الآن",
            data: { acidRequestId: "test123" },
            sendPush: true,
            priority: "medium",
        });
        results.push({ test: "ACID - بدء المراجعة", status: "✅" });
    } catch (err) {
        results.push({ test: "ACID - بدء المراجعة", status: "❌", error: err.message });
    }
    
    await sleep(1000);
    
    // Test 2: ACID - إصدار رقم ACID
    console.log('📝 اختبار 2: ACID - إصدار رقم ACID');
    try {
        await notificationService.notifyAcidIssued(user._id, "ACID-TEST-123", "test123");
        results.push({ test: "ACID - إصدار رقم", status: "✅" });
    } catch (err) {
        results.push({ test: "ACID - إصدار رقم", status: "❌", error: err.message });
    }
    
    await sleep(1000);
    
    // Test 3: ACID - رفض الطلب
    console.log('📝 اختبار 3: ACID - رفض الطلب');
    try {
        await notificationService.createNotification({
            userId: user._id,
            type: "acid_rejected",
            message: "اختبار: تم رفض طلب ACID الخاص بك. السبب: مستندات غير مكتملة",
            data: { acidRequestId: "test123", reason: "مستندات غير مكتملة" },
            sendPush: true,
            priority: "high",
        });
        results.push({ test: "ACID - رفض الطلب", status: "✅" });
    } catch (err) {
        results.push({ test: "ACID - رفض الطلب", status: "❌", error: err.message });
    }
    
    await sleep(1000);
    
    // Test 4: UCR - إنشاء طلب جديد
    console.log('📝 اختبار 4: UCR - إنشاء طلب جديد');
    try {
        await notificationService.notifyUCRStatus(user._id, "test123", "UCR-2024-001", "created");
        results.push({ test: "UCR - إنشاء طلب", status: "✅" });
    } catch (err) {
        results.push({ test: "UCR - إنشاء طلب", status: "❌", error: err.message });
    }
    
    await sleep(1000);
    
    // Test 5: UCR - قبول الطلب
    console.log('📝 اختبار 5: UCR - قبول الطلب');
    try {
        await notificationService.notifyUCRStatus(user._id, "test123", "UCR-2024-001", "approved");
        results.push({ test: "UCR - قبول الطلب", status: "✅" });
    } catch (err) {
        results.push({ test: "UCR - قبول الطلب", status: "❌", error: err.message });
    }
    
    await sleep(1000);
    
    // Test 6: UCR - شهادة المنشأ
    console.log('📝 اختبار 6: UCR - إصدار شهادة المنشأ');
    try {
        await notificationService.notifyUCRStatus(user._id, "test123", "UCR-2024-001", "certificate_issued");
        results.push({ test: "UCR - شهادة المنشأ", status: "✅" });
    } catch (err) {
        results.push({ test: "UCR - شهادة المنشأ", status: "❌", error: err.message });
    }
    
    await sleep(1000);
    
    // Test 7: Shipments - تغيير حالة الشحنة
    console.log('📝 اختبار 7: Shipments - تغيير حالة الشحنة');
    try {
        await notificationService.notifyShipmentStatusChange(
            user._id,
            "test123",
            "SHIP-2024-001",
            "Pending",
            "في الطريق"
        );
        results.push({ test: "Shipments - تغيير حالة", status: "✅" });
    } catch (err) {
        results.push({ test: "Shipments - تغيير حالة", status: "❌", error: err.message });
    }
    
    await sleep(1000);
    
    // Test 8: Shipments - طلب مستندات
    console.log('📝 اختبار 8: Shipments - طلب مستندات إضافية');
    try {
        await notificationService.notifyShipmentDocumentsRequested(
            user._id,
            "test123",
            "SHIP-2024-001",
            [{ name: "فاتورة تجارية" }, { name: "شهادة المنشأ" }]
        );
        results.push({ test: "Shipments - طلب مستندات", status: "✅" });
    } catch (err) {
        results.push({ test: "Shipments - طلب مستندات", status: "❌", error: err.message });
    }
    
    await sleep(1000);
    
    // Test 9: Documents - قبول مستند
    console.log('📝 اختبار 9: Documents - قبول مستند');
    try {
        await notificationService.notifyDocumentStatus(user._id, "commercial_register", "approved");
        results.push({ test: "Documents - قبول مستند", status: "✅" });
    } catch (err) {
        results.push({ test: "Documents - قبول مستند", status: "❌", error: err.message });
    }
    
    await sleep(1000);
    
    // Test 10: Documents - رفض مستند
    console.log('📝 اختبار 10: Documents - رفض مستند');
    try {
        await notificationService.notifyDocumentStatus(
            user._id, 
            "tax_card", 
            "rejected", 
            "الصورة غير واضحة"
        );
        results.push({ test: "Documents - رفض مستند", status: "✅" });
    } catch (err) {
        results.push({ test: "Documents - رفض مستند", status: "❌", error: err.message });
    }
    
    await sleep(1000);
    
    // Test 11: Auth - تغيير كلمة المرور
    console.log('📝 اختبار 11: Auth - تغيير كلمة المرور');
    try {
        await notificationService.createNotification({
            userId: user._id,
            type: "password_changed",
            message: "اختبار: تم تغيير كلمة المرور الخاصة بك بنجاح",
            sendPush: true,
            priority: "high",
        });
        results.push({ test: "Auth - تغيير كلمة المرور", status: "✅" });
    } catch (err) {
        results.push({ test: "Auth - تغيير كلمة المرور", status: "❌", error: err.message });
    }
    
    await sleep(1000);
    
    // Test 12: Auth - تفعيل الحساب
    console.log('📝 اختبار 12: Auth - تفعيل الحساب');
    try {
        await notificationService.notifyAccountActivated(user._id);
        results.push({ test: "Auth - تفعيل الحساب", status: "✅" });
    } catch (err) {
        results.push({ test: "Auth - تفعيل الحساب", status: "❌", error: err.message });
    }
    
    await sleep(1000);
    
    // Test 13: Chat - رسالة جديدة
    console.log('📝 اختبار 13: Chat - رسالة جديدة');
    try {
        await notificationService.notifyChatMessage(user._id, "test123", "فريق الدعم");
        results.push({ test: "Chat - رسالة جديدة", status: "✅" });
    } catch (err) {
        results.push({ test: "Chat - رسالة جديدة", status: "❌", error: err.message });
    }
    
    // Print results
    console.log('\n' + '='.repeat(60));
    console.log('📊 نتائج الاختبارات:');
    console.log('='.repeat(60));
    
    results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.status} ${result.test}${result.error ? ` - ${result.error}` : ''}`);
    });
    
    const passed = results.filter(r => r.status === "✅").length;
    const failed = results.filter(r => r.status === "❌").length;
    
    console.log('='.repeat(60));
    console.log(`📈 الملخص: ${passed} نجح، ${failed} فشل`);
    console.log('='.repeat(60));
    
    console.log('\n✅ تم الانتهاء من الاختبارات!');
    console.log('📱 تحقق من وصول الإشعارات على التطبيق');
    
    await mongoose.disconnect();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

testNotifications().catch(console.error);
