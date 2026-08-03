# إصلاح V5

هذه النسخة تصلح مشكلة الصفحة البيضاء.

السبب كان:
- خطأ Syntax في app.js.
- استخدام React Hooks مع React 16.0 الذي لا يدعم Hooks.

تم تحويل التطبيق إلى React Class Component متوافق.

## التحديث
ارفع كل الملفات واستبدل الملفات القديمة، ثم Commit changes.
بعد التحديث على iPhone:
1. احذف أيقونة التطبيق.
2. Settings > Safari > Advanced > Website Data.
3. ابحث عن github.io واحذف بيانات الموقع، أو افتح الرابط في Private Tab.
4. أعد إضافة التطبيق إلى Home Screen.
