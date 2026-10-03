/* Devma Accounting System — Arabic translation & right-to-left support.
   The UI is written in English; when Arabic is active, every rendered text node and
   placeholder/title is translated on the fly (MutationObserver), and the page switches to RTL. */
'use strict';
const AR = {
  /* brand & login */
  'Devma': 'ديفما', 'System': 'النظام', 'Accounting System': 'للمحاسبة', 'Devma Accounting System': 'ديفما للمحاسبة',
  'Computers & Software': 'كمبيوتر وبرمجيات', 'ORGANIZE YOUR': 'نظّم', 'BUSINESS': 'أعمالك', 'WITH US': 'معنا',
  'One system for sales, stock, rooms, production and accounting — built for growing businesses.': 'نظام واحد للمبيعات والمخزون والغرف والإنتاج والمحاسبة — مصمّم للأعمال النامية.',
  'Point of sale & invoices': 'نقطة بيع وفواتير', 'Live stock across warehouses': 'مخزون مباشر في جميع المستودعات', 'Double-entry accounting & reports': 'محاسبة بالقيد المزدوج وتقارير', 'Multi-currency with converter': 'عملات متعددة مع محوّل',
  'GET IN TOUCH': 'تواصل معنا', 'Login To Your Account Into': 'سجّل الدخول إلى حسابك في', 'Username': 'اسم المستخدم', 'Password': 'كلمة المرور', 'Show password': 'إظهار كلمة المرور',
  'Remember me': 'تذكّرني', 'Forgot password?': 'نسيت كلمة المرور؟', 'Forgot password': 'نسيت كلمة المرور', 'Login': 'دخول', 'Demo users:': 'مستخدمو العرض:',
  'Wrong username or password.': 'اسم المستخدم أو كلمة المرور غير صحيحة.', 'This user is disabled. Contact your administrator.': 'هذا المستخدم معطّل. راجع مسؤول النظام.',
  'Passwords are reset by an administrator from': 'يعيد المسؤول تعيين كلمات المرور من', 'Settings → User Management → Reset password': 'الإعدادات ← إدارة المستخدمين ← إعادة تعيين كلمة المرور',
  'Demo administrator:': 'مسؤول العرض:', 'OK': 'موافق', 'DevmaData — database': 'DevmaData — قاعدة البيانات', 'Company:': 'الشركة:',
  'Data is stored securely in this browser. Use Backup to move it to another computer.': 'البيانات محفوظة في هذا المتصفح. استخدم النسخ الاحتياطي لنقلها إلى جهاز آخر.',

  /* modules & navigation */
  'Rooms': 'الغرف', 'P.O.S': 'نقطة البيع', 'Money Converter': 'محوّل العملات', 'Money converter': 'محوّل العملات', 'Categories': 'الفئات', 'Currencies': 'العملات', 'Vouchers': 'السندات',
  'Items': 'المواد', 'Stock Inventory': 'جرد المخزون', 'Accounts': 'الحسابات', 'Invoices': 'الفواتير', 'Cash Box': 'الصندوق', 'Salesman': 'المندوب', 'Stock Management': 'إدارة المخزون',
  'Production Line': 'خط الإنتاج', 'Disassembling': 'التفكيك', 'Trial Balance': 'ميزان المراجعة', 'Account Statement': 'كشف حساب', 'Warehouses': 'المستودعات', 'User Management': 'إدارة المستخدمين',
  'Settings': 'الإعدادات', 'Update / Waste Stock': 'تعديل / تلف المخزون', 'Backup': 'النسخ الاحتياطي', 'All Reports': 'جميع التقارير', 'Automated Tasks': 'المهام التلقائية',
  'Dashboard': 'لوحة التحكم', 'Items List': 'قائمة المواد', 'Transfers': 'التحويلات', 'Opening Stock': 'بضاعة أول المدة', 'Opening stock': 'بضاعة أول المدة', 'Stock Movements': 'حركات المخزون',
  'Update / Waste': 'تعديل / تلف', 'Sales & POS': 'المبيعات ونقطة البيع', 'Point of Sale': 'نقطة البيع', 'Salesmen': 'المندوبون', 'Chart of Accounts': 'دليل الحسابات', 'Chart of accounts': 'دليل الحسابات',
  'Customers': 'العملاء', 'Suppliers': 'الموردون', 'Sales': 'المبيعات', 'Purchases': 'المشتريات', 'Sales Returns': 'مرتجعات المبيعات', 'Purchase Returns': 'مرتجعات المشتريات',
  'Receipts': 'سندات القبض', 'Payments': 'الدفعات', 'Journal': 'القيود', 'Reports': 'التقارير', 'Account statement': 'كشف حساب', 'Trial balance': 'ميزان المراجعة', 'General Settings': 'الإعدادات العامة',
  'About System': 'حول النظام', 'About system': 'حول النظام', 'Stock': 'المخزون', 'Home': 'الرئيسية', 'Users': 'المستخدمون', 'Automated tasks': 'المهام التلقائية',
  'Search items, accounts, invoices…': 'ابحث في المواد والحسابات والفواتير…', 'Toggle dark mode': 'الوضع الداكن', 'Notifications': 'الإشعارات', 'Toggle menu': 'القائمة',
  'My profile': 'ملفي الشخصي', 'Change password': 'تغيير كلمة المرور', 'Logout': 'تسجيل الخروج', 'Welcome': 'مرحباً', 'Log out of Devma?': 'تسجيل الخروج من ديفما؟',
  'Mark all read': 'تحديد الكل كمقروء', 'Clear': 'مسح', 'You are all caught up.': 'لا توجد إشعارات جديدة.', 'No results': 'لا نتائج', 'Open module': 'فتح الوحدة',
  'New sales invoice': 'فاتورة مبيعات جديدة', 'New purchase invoice': 'فاتورة مشتريات جديدة', 'New receipt voucher': 'سند قبض جديد', 'New payment voucher': 'سند دفع جديد', 'New journal voucher': 'قيد يومية جديد',
  'New sales return': 'مرتجع مبيعات جديد', 'New purchase return': 'مرتجع مشتريات جديد', 'New Sales Invoice': 'فاتورة مبيعات جديدة', 'New Purchase Invoice': 'فاتورة مشتريات جديدة',
  'New Sales Return': 'مرتجع مبيعات جديد', 'New Purchase Return': 'مرتجع مشتريات جديد', 'New Receipt Voucher': 'سند قبض جديد', 'New Payment Voucher': 'سند دفع جديد',
  'Page not found': 'الصفحة غير موجودة', 'This page does not exist.': 'هذه الصفحة غير موجودة.', 'Back to dashboard': 'العودة إلى لوحة التحكم', 'Access denied': 'الوصول مرفوض', 'Something went wrong': 'حدث خطأ',
  'Your user role does not have permission to open this module. Ask an administrator to grant it in User Management.': 'ليس لدى دورك صلاحية فتح هذه الوحدة. اطلب من المسؤول منحها من إدارة المستخدمين.',
  'Profile updated': 'تم تحديث الملف الشخصي', 'Full name': 'الاسم الكامل', 'Role': 'الدور', 'Last login': 'آخر دخول', 'Current password': 'كلمة المرور الحالية', 'New password': 'كلمة المرور الجديدة',
  'Repeat new password': 'تأكيد كلمة المرور الجديدة', 'Password changed': 'تم تغيير كلمة المرور', 'Current password is wrong.': 'كلمة المرور الحالية خاطئة.', 'New passwords do not match.': 'كلمتا المرور غير متطابقتين.',

  /* dashboard */
  "Today's sales": 'مبيعات اليوم', 'This month': 'هذا الشهر', 'Cash & bank': 'الصندوق والبنك', 'Receivables': 'الذمم المدينة', 'Payables': 'الذمم الدائنة', 'Low stock': 'مخزون منخفض',
  'Rooms occupied': 'الغرف المشغولة', 'Open POS': 'فتح نقطة البيع', 'New sale': 'بيع جديد', 'Sales — last 7 days': 'المبيعات — آخر 7 أيام', 'Full report →': 'التقرير الكامل ←',
  'Recent invoices': 'أحدث الفواتير', 'All invoices →': 'كل الفواتير ←', 'No invoices yet.': 'لا توجد فواتير بعد.',

  /* common */
  'Save': 'حفظ', 'Cancel': 'إلغاء', 'Delete': 'حذف', 'Edit': 'تعديل', 'Print': 'طباعة', 'Close': 'إغلاق', 'Back': 'رجوع', 'List': 'القائمة', 'Duplicate': 'نسخ', 'Return': 'إرجاع', 'Receipt': 'إيصال',
  'Receive payment': 'استلام دفعة', 'Make payment': 'تسديد دفعة', 'Confirm': 'تأكيد', 'Please confirm': 'يرجى التأكيد', 'Apply': 'تطبيق', 'Add': 'إضافة', 'Add line': 'إضافة سطر', 'Remove': 'إزالة',
  'Remove line': 'إزالة السطر', 'Load': 'تحميل', 'View': 'عرض', 'Restore': 'استعادة', 'Import': 'استيراد', 'Undo': 'تراجع', 'Repeat': 'تكرار', 'Post': 'ترحيل', 'Reset': 'إعادة تعيين',
  'Run now': 'تشغيل الآن', 'Deactivate': 'إلغاء التفعيل', 'Enable': 'تفعيل', 'Disable': 'تعطيل', 'Continue': 'متابعة', 'Save anyway': 'حفظ على أي حال', 'Save & new': 'حفظ وجديد', 'Save & print': 'حفظ وطباعة',
  'Full': 'كامل', 'None': 'لا شيء', 'Generate': 'توليد', 'New': 'جديد', 'All': 'الكل', 'Show': 'عرض', 'Show all': 'عرض الكل', 'Default': 'افتراضي', 'Make default': 'تعيين كافتراضي',
  'Today': 'اليوم', 'today': 'اليوم', 'Previous day': 'اليوم السابق', 'Next day': 'اليوم التالي', 'This year': 'هذه السنة', 'Last 30 days': 'آخر 30 يوماً', 'All time': 'كل الفترات', 'From': 'من', 'To': 'إلى',
  'As of': 'حتى تاريخ', 'Date': 'التاريخ', 'Number': 'الرقم', 'Document': 'المستند', 'Description': 'البيان', 'Amount': 'المبلغ', 'Total': 'الإجمالي', 'Subtotal': 'المجموع الفرعي', 'Discount': 'الخصم',
  'Net': 'الصافي', 'Tax': 'الضريبة', 'Tax %': 'الضريبة %', 'Tax amount': 'قيمة الضريبة', 'Balance due': 'الرصيد المستحق', 'Paid now': 'المدفوع الآن', 'Due': 'المستحق', 'Status': 'الحالة', 'Type': 'النوع',
  'Name': 'الاسم', 'Code': 'الرمز', 'Item': 'المادة', 'Unit': 'الوحدة', 'Qty': 'الكمية', 'Quantity': 'الكمية', 'Price': 'السعر', 'Disc %': 'خصم %', 'Disc': 'خصم', 'Cost': 'الكلفة', 'Value': 'القيمة',
  'Category': 'الفئة', 'Warehouse': 'المستودع', 'Customer': 'العميل', 'Supplier': 'المورد', 'Party': 'الطرف', 'Notes': 'ملاحظات', 'Note': 'ملاحظة', 'Reason': 'السبب', 'By': 'بواسطة', 'Phone': 'الهاتف',
  'Email': 'البريد الإلكتروني', 'Address': 'العنوان', 'Active': 'نشط', 'Inactive': 'غير نشط', 'Location': 'الموقع', 'Account': 'الحساب', 'Debit': 'مدين', 'Credit': 'دائن', 'Balance': 'الرصيد',
  'Opening': 'الافتتاحي', 'Closing': 'الختامي', 'Lines': 'الأسطر', 'Label': 'ملصق', 'Time': 'الوقت', 'When': 'الوقت', 'User': 'المستخدم', 'Action': 'الإجراء', 'Detail': 'التفاصيل', 'Result': 'النتيجة',
  'Details': 'التفاصيل', 'Total (posting accounts)': 'الإجمالي (حسابات الترحيل)', 'Totals': 'الإجماليات', 'Search…': 'بحث…', 'Export to CSV': 'تصدير CSV', 'No records found.': 'لا توجد سجلات.',
  'Close dialog': 'إغلاق', 'Paid': 'مدفوعة', 'Partial': 'جزئية', 'Unpaid': 'غير مدفوعة', 'Rate': 'السعر', 'Equivalent': 'المعادل', 'Currency': 'العملة', 'Saved': 'تم الحفظ', 'You': 'أنت',
  'Never': 'أبداً', 'Created': 'أُنشئ', 'Updated': 'عُدّل', 'Deleted': 'حُذف', 'Week': 'أسبوع', 'Yes': 'نعم', 'No': 'لا', 'Interest': 'فائدة', 'deleted item': 'مادة محذوفة', 'just now': 'الآن',
  'Item not found': 'المادة غير موجودة', 'Copied': 'تم النسخ', 'Nothing to import.': 'لا شيء للاستيراد.',

  /* items */
  'New item': 'مادة جديدة', 'Import CSV': 'استيراد CSV', 'Print list': 'طباعة القائمة', 'All categories': 'كل الفئات', 'All types': 'كل الأنواع', 'Active items': 'المواد النشطة',
  'Low stock only': 'المخزون المنخفض فقط', 'Inactive items': 'المواد غير النشطة', 'All items': 'كل المواد', 'Search name, code or barcode…': 'ابحث بالاسم أو الرمز أو الباركود…', 'On hand': 'الموجود',
  'Stock item': 'مادة مخزنية', 'Raw material': 'مادة خام', 'Service': 'خدمة', 'service': 'خدمة', 'Item name': 'اسم المادة', 'Barcode': 'الباركود', 'Sale price': 'سعر البيع',
  'Minimum qty (reorder level)': 'الحد الأدنى (حد إعادة الطلب)', 'Margin': 'هامش الربح', 'Opening stock (optional)': 'بضاعة أول المدة (اختياري)', 'Opening quantity': 'الكمية الافتتاحية',
  'Active (available for sale and purchase)': 'نشطة (متاحة للبيع والشراء)', 'New category': 'فئة جديدة', 'Item created': 'تم إنشاء المادة', 'Item saved': 'تم حفظ المادة', 'Item deleted': 'تم حذف المادة',
  'Item deactivated': 'تم إلغاء تفعيل المادة', 'Average cost': 'متوسط الكلفة', 'Avg cost': 'متوسط الكلفة', 'Stock value': 'قيمة المخزون', 'stock value': 'قيمة المخزون', 'Sold (30 days)': 'المباع (30 يوماً)',
  'Adjust stock': 'تعديل المخزون', 'Stock by warehouse': 'المخزون حسب المستودع', 'Stock card': 'بطاقة الصنف', 'Movement': 'الحركة', 'In': 'وارد', 'Out': 'صادر', 'Unit cost': 'كلفة الوحدة',
  'Print shelf labels': 'طباعة ملصقات الرفوف', 'Number of labels': 'عدد الملصقات', 'Show price in': 'عرض السعر بعملة', 'Item not found.': 'المادة غير موجودة.', 'No transactions yet.': 'لا توجد حركات بعد.',
  'Purchase': 'شراء', 'Sale': 'بيع', 'Sales return': 'مرتجع مبيعات', 'Purchase return': 'مرتجع مشتريات', 'Transfer': 'تحويل', 'Increase': 'زيادة', 'Decrease': 'نقص', 'Waste': 'تلف',
  'Stock count': 'جرد فعلي', 'Used in production': 'مستخدم في الإنتاج', 'Produced': 'مُنتَج', 'Disassembled': 'مفكّك', 'From disassembly': 'من التفكيك', 'Production (used)': 'إنتاج (مستهلك)',
  'Production (made)': 'إنتاج (منتَج)', 'Disassembly (source)': 'تفكيك (المصدر)', 'Disassembly (parts)': 'تفكيك (القطع)', 'Import items from CSV': 'استيراد المواد من CSV', 'Download template': 'تنزيل القالب',
  'Inactive': 'غير نشط', 'Items list': 'قائمة المواد', 'Opening': 'الافتتاحي', 'Sales history': 'سجل المبيعات',

  /* categories & warehouses */
  'Parent': 'الفئة الأم', 'Parent category': 'الفئة الأم', 'Colour': 'اللون', '— None —': '— لا شيء —', 'Category saved': 'تم حفظ الفئة', 'Category deleted': 'تم حذف الفئة', 'Edit category': 'تعديل الفئة',
  'Beverages': 'مشروبات', 'Snacks': 'وجبات خفيفة', 'Dairy': 'ألبان', 'Bakery': 'مخبوزات', 'Cleaning': 'تنظيف', 'Raw Materials': 'مواد أولية', 'Services': 'خدمات',
  'New warehouse': 'مستودع جديد', 'Transfer stock': 'تحويل مخزون', 'items in stock': 'مواد في المخزون', 'View stock': 'عرض المخزون', 'Store keeper': 'أمين المستودع', 'Keeper': 'أمين المستودع',
  'Edit warehouse': 'تعديل المستودع', 'Main Warehouse': 'المستودع الرئيسي', 'Shop Floor': 'صالة المحل', 'Warehouse saved': 'تم حفظ المستودع', 'Warehouse deleted': 'تم حذف المستودع',
  'Default warehouse changed': 'تم تغيير المستودع الافتراضي', 'Industrial Zone, Dora': 'المنطقة الصناعية، الدورة', 'Hamra Street': 'شارع الحمرا',

  /* currencies & converter */
  'Base': 'أساسية', 'Base currency': 'العملة الأساسية', 'Symbol': 'الرمز', 'Update rate': 'تحديث السعر', 'Rate history': 'سجل الأسعار', 'Old rate': 'السعر القديم', 'New rate': 'السعر الجديد',
  'Change': 'الباقي', 'New currency': 'عملة جديدة', 'Decimals': 'الخانات العشرية', 'Rate updated': 'تم تحديث السعر', 'US Dollar': 'دولار أمريكي', 'Lebanese Pound': 'ليرة لبنانية', 'Euro': 'يورو',
  'Currency saved': 'تم حفظ العملة', 'Currency deleted': 'تم حذف العملة', 'No rate changes yet.': 'لا توجد تغييرات على الأسعار بعد.', 'Manage rates': 'إدارة الأسعار', 'Swap': 'تبديل',
  'Copy result': 'نسخ النتيجة', 'Save to history': 'حفظ في السجل', 'In every currency': 'بكل العملات', 'History': 'السجل', 'Saved conversions appear here.': 'تظهر التحويلات المحفوظة هنا.',
  'Saved to history': 'تم الحفظ في السجل', 'The base currency rate is always 1.': 'سعر العملة الأساسية دائماً 1.', 'Edit currency': 'تعديل العملة', 'Code (e.g. GBP)': 'الرمز (مثل GBP)',

  /* inventory */
  'Items listed': 'المواد المعروضة', 'Total quantity': 'إجمالي الكمية', 'Stock value (cost)': 'قيمة المخزون (بالكلفة)', 'Retail value': 'قيمة البيع', 'All warehouses': 'كل المستودعات',
  'Show zero-stock items': 'عرض المواد ذات الرصيد صفر', 'Min': 'الحد الأدنى', 'Out of stock': 'نفد', 'Low': 'منخفض', 'Physical stock count': 'الجرد الفعلي للمخزون', 'System qty': 'الكمية بالنظام',
  'Counted': 'المعدود', 'Difference': 'الفرق', 'Post count': 'ترحيل الجرد', 'No differences to post.': 'لا توجد فروقات للترحيل.', 'Inventory': 'المخزون',
  'Enter the counted quantity. Leave blank to skip an item. Differences post as stock adjustments.': 'أدخل الكمية المعدودة، واترك الحقل فارغاً لتجاوز المادة. تُرحَّل الفروقات كتسويات مخزون.',

  /* stock management */
  'New transfer': 'تحويل جديد', 'New stock transfer': 'تحويل مخزون جديد', 'From warehouse': 'من المستودع', 'To warehouse': 'إلى المستودع', 'Save transfer': 'حفظ التحويل', 'Total qty': 'إجمالي الكمية',
  'Enter opening stock': 'إدخال بضاعة أول المدة', 'All movements': 'كل الحركات', 'Available': 'متاح', 'Type code, name or scan barcode': 'اكتب الرمز أو الاسم أو امسح الباركود',
  'No transfers yet. Click "New transfer" to move stock between warehouses.': 'لا توجد تحويلات بعد. اضغط "تحويل جديد" لنقل المخزون بين المستودعات.', 'No opening stock entered.': 'لم تُدخل بضاعة أول المدة.',
  'Create a second warehouse first (Items → Warehouses).': 'أنشئ مستودعاً ثانياً أولاً (المواد ← المستودعات).', 'Transfer deleted': 'تم حذف التحويل', 'Stock transfer': 'تحويل مخزون',
  'Update / waste stock': 'تعديل / تلف المخزون', 'Increase stock (+)': 'زيادة المخزون (+)', 'Decrease stock (−)': 'إنقاص المخزون (−)', 'Waste / damaged (−)': 'تلف / تالف (−)', 'Choose or type': 'اختر أو اكتب',
  'Record waste': 'تسجيل تلف', 'Waste this month': 'التلف هذا الشهر', 'Adjustments': 'التسويات', 'Net adjustment value': 'صافي قيمة التسويات', 'Stock Increase': 'زيادة مخزون', 'Stock Decrease': 'نقص مخزون',
  'Waste / Damaged': 'تلف / تالف', 'Stock Count': 'جرد فعلي', 'Journal entry': 'قيد اليومية', 'No adjustments yet.': 'لا توجد تسويات بعد.', 'Adjustment deleted': 'تم حذف التسوية',
  'Expired': 'منتهي الصلاحية', 'Damaged': 'تالف', 'Spoiled': 'فاسد', 'Broken in transit': 'مكسور أثناء النقل', 'Found during count': 'وُجد أثناء الجرد', 'Received free sample': 'عيّنة مجانية',
  'Correction': 'تصحيح', 'Lost / missing': 'مفقود', 'Internal use': 'استخدام داخلي', 'Given as sample': 'أُعطي كعيّنة', 'Physical count': 'جرد فعلي', 'Expired milk': 'حليب منتهي الصلاحية',
  'Opening stock records quantities you already had before using Devma. Its value is posted to': 'تسجّل بضاعة أول المدة الكميات الموجودة لديك قبل استخدام ديفما. تُرحَّل قيمتها إلى',
  'Adds quantity. Value posts to': 'يضيف كمية. تُرحَّل القيمة إلى', 'Enter a unit cost to update the average cost.': 'أدخل كلفة الوحدة لتحديث متوسط الكلفة.', 'Removes quantity at average cost. Value posts to': 'يُنقص الكمية بمتوسط الكلفة. تُرحَّل القيمة إلى',
  'Removes damaged / expired stock at average cost. Value posts to': 'يُزيل المخزون التالف / المنتهي بمتوسط الكلفة. تُرحَّل القيمة إلى', 'Adds stock you already owned. Value posts to': 'يضيف مخزوناً تملكه مسبقاً. تُرحَّل القيمة إلى',
  'expense.': 'كمصروف.',

  /* production & disassembly */
  'New recipe': 'وصفة جديدة', 'New production': 'إنتاج جديد', 'Production orders': 'أوامر الإنتاج', 'Recipes (BOM)': 'الوصفات (قائمة المواد)', 'Recipe': 'الوصفة', 'Batches': 'الدفعات', 'Output': 'الناتج',
  'Total cost': 'الكلفة الإجمالية', 'Finished item': 'المنتج النهائي', 'Output / batch': 'الناتج / دفعة', 'Components': 'المكونات', 'Batch cost': 'كلفة الدفعة', 'Produce': 'إنتاج',
  'New production order': 'أمر إنتاج جديد', 'Materials required': 'المواد المطلوبة', 'Component': 'المكوّن', 'Needed': 'المطلوب', 'Materials consumed': 'المواد المستهلكة', 'Produce again': 'إنتاج مرة أخرى',
  'Recipe name': 'اسم الوصفة', 'Output quantity per batch': 'كمية الناتج لكل دفعة', 'Labour / overhead per batch': 'العمالة / المصاريف لكل دفعة', 'Components used per batch': 'المكونات المستخدمة لكل دفعة',
  'Save recipe': 'حفظ الوصفة', 'New recipe (bill of materials)': 'وصفة جديدة (قائمة المواد)', 'Edit recipe': 'تعديل الوصفة', 'Recipe saved': 'تم حفظ الوصفة', 'Production undone': 'تم التراجع عن الإنتاج',
  'Recipe deleted': 'تم حذف الوصفة', 'No production yet.': 'لا يوجد إنتاج بعد.', 'Create a recipe first.': 'أنشئ وصفة أولاً.', 'Morning bake': 'خَبز الصباح',
  'No recipes yet. A recipe lists the materials needed to make one batch of a product.': 'لا توجد وصفات بعد. الوصفة تحدد المواد اللازمة لإنتاج دفعة واحدة من المنتج.',
  'New disassembly': 'تفكيك جديد', 'Disassemble item': 'تفكيك مادة', 'Item to disassemble': 'المادة المراد تفكيكها', 'Source item': 'المادة المصدر', 'Parts': 'القطع', 'Cost split': 'الكلفة الموزّعة',
  'Output parts': 'القطع الناتجة', 'Split cost by sale value': 'توزيع الكلفة حسب قيمة البيع', 'Cost share %': 'حصة الكلفة %', 'Disassemble': 'تفكيك', 'Parts recovered': 'القطع المستردة', 'Share': 'الحصة',
  'Disassembly': 'تفكيك', 'Nothing disassembled yet.': 'لم يتم تفكيك أي شيء بعد.', 'Damaged boxes — recover contents': 'علب تالفة — استرداد المحتويات',
  'Break a kit, bundle or damaged product into its parts. The source item\'s cost is split between the parts by the percentages you set.': 'فكّك طقماً أو حزمة أو منتجاً تالفاً إلى قطعه. تُوزَّع كلفة المادة المصدر على القطع حسب النسب التي تحددها.',
  'Choose an item. If it has a production recipe, its components are filled in automatically.': 'اختر مادة. إذا كانت لها وصفة إنتاج تُعبّأ مكوناتها تلقائياً.',

  /* invoices */
  'Sales Invoice': 'فاتورة مبيعات', 'Purchase Invoice': 'فاتورة مشتريات', 'Sales Return': 'مرتجع مبيعات', 'Purchase Return': 'مرتجع مشتريات', 'Sales Invoices': 'فواتير المبيعات', 'Purchase Invoices': 'فواتير المشتريات',
  'Receipt Voucher': 'سند قبض', 'Payment Voucher': 'سند دفع', 'Journal Voucher': 'قيد يومية', 'Receipt Vouchers': 'سندات القبض', 'Payment Vouchers': 'سندات الدفع', 'Journal Vouchers': 'قيود اليومية',
  'SALES INVOICE': 'فاتورة مبيعات', 'Outstanding': 'غير المحصّل', 'Supplier ref. no.': 'رقم مرجع المورد', 'Scan barcode or type code + Enter': 'امسح الباركود أو اكتب الرمز ثم Enter', 'In stock': 'في المخزون',
  'Type code, name or barcode…': 'اكتب الرمز أو الاسم أو الباركود…', 'Payment': 'الدفع', 'Amount received now': 'المبلغ المستلم الآن', 'Amount paid now': 'المبلغ المدفوع الآن', 'Cash / bank account': 'حساب الصندوق / البنك',
  "The unpaid balance stays on the customer's account. You can record more payments later from the invoice.": 'يبقى الرصيد غير المدفوع على حساب العميل، ويمكنك تسجيل دفعات لاحقاً من الفاتورة.',
  "The unpaid balance stays on the supplier's account. You can record more payments later from the invoice.": 'يبقى الرصيد غير المدفوع على حساب المورد، ويمكنك تسجيل دفعات لاحقاً من الفاتورة.',
  'Invoice total': 'إجمالي الفاتورة', 'Paid at invoice': 'مدفوع عند الفاتورة', 'Returns': 'المرتجعات', 'Return of': 'مرتجع من', 'POS sale': 'بيع نقطة البيع', 'Room checkout': 'خروج غرفة', 'POS': 'نقطة البيع',
  'Bill to': 'الفاتورة إلى', 'Prepared by': 'أعدّه', 'Received by': 'استلمه', 'Thank you for your business!': 'شكراً لتعاملكم معنا!', 'Cashier': 'الكاشير', 'TOTAL': 'الإجمالي', 'Tax no.': 'الرقم الضريبي',
  'Statement →': 'كشف الحساب ←', 'Invoice not found': 'الفاتورة غير موجودة', 'This invoice was deleted or does not exist.': 'هذه الفاتورة محذوفة أو غير موجودة.', 'Back to invoices': 'العودة إلى الفواتير',
  'Invoice deleted': 'تم حذف الفاتورة', 'Discount': 'الخصم', 'Rate (per': 'السعر (لكل', 'Notes': 'ملاحظات', 'Payment for': 'دفعة عن', 'Payment received for': 'دفعة مستلمة عن', 'Return of SI': 'مرتجع من',
  'Damaged on delivery': 'تالف عند التسليم', 'Add at least one item with a quantity greater than zero.': 'أضف مادة واحدة على الأقل بكمية أكبر من صفر.', 'Paid amount cannot exceed the invoice total.': 'لا يمكن أن يتجاوز المبلغ المدفوع إجمالي الفاتورة.',
  'This walk-in sale is not fully paid. The balance will stay on the Walk-in Customer account. Continue?': 'هذا البيع النقدي غير مدفوع بالكامل، وسيبقى الرصيد على حساب العميل النقدي. متابعة؟',
  'Tip: this invoice came from a room checkout — editing it will not reopen the room.': 'ملاحظة: هذه الفاتورة من خروج غرفة — تعديلها لن يعيد فتح الغرفة.', 'Delete invoice': 'حذف الفاتورة',
  'Status': 'الحالة', 'Supplier': 'المورد', 'Customer': 'العميل',

  /* vouchers & journal */
  'Received from (account)': 'مستلم من (الحساب)', 'Paid to (account)': 'مدفوع إلى (الحساب)', 'Deposit to': 'إيداع في', 'Pay from': 'الدفع من', 'Against invoice (optional)': 'مقابل فاتورة (اختياري)',
  '— On account (no specific invoice) —': '— على الحساب (بدون فاتورة محددة) —', 'Received from': 'مستلم من', 'Paid to': 'مدفوع إلى', 'Deposited to': 'أودع في', 'Paid from': 'دُفع من', 'Invoice': 'الفاتورة',
  'For invoice': 'عن الفاتورة', 'Description:': 'البيان:', 'Signature': 'التوقيع', 'Prepared by:': 'أعدّه:', 'Line note': 'ملاحظة السطر', 'Balance last line': 'موازنة السطر الأخير', 'Balanced': 'متوازن',
  'Not balanced': 'غير متوازن', 'Open source document': 'فتح المستند المصدر', 'Reference': 'المرجع', 'Posted by': 'رحّله', 'Posted at': 'وقت الترحيل', 'Linked to invoice': 'مرتبط بالفاتورة',
  'No vouchers yet.': 'لا توجد سندات بعد.', 'Total amount': 'إجمالي المبلغ', 'Voucher deleted': 'تم حذف السند', 'Voucher not found': 'السند غير موجود', 'This voucher was deleted.': 'هذا السند محذوف.',
  'Back to vouchers': 'العودة إلى السندات', 'Journal entry not found': 'القيد غير موجود', 'This entry no longer exists.': 'هذا القيد لم يعد موجوداً.', 'Current balance of': 'الرصيد الحالي لـ',
  'Shop rent — this month': 'إيجار المحل — هذا الشهر', 'Electricity & water': 'كهرباء ومياه', 'Staff salaries': 'رواتب الموظفين', 'Partial settlement': 'تسوية جزئية', 'Owner capital contribution': 'مساهمة رأس مال المالك',
  'Choose the account.': 'اختر الحساب.', 'Choose the cash / bank account.': 'اختر حساب الصندوق / البنك.', 'Amount must be greater than zero.': 'يجب أن يكون المبلغ أكبر من صفر.',
  'A journal voucher needs at least two lines.': 'يحتاج قيد اليومية إلى سطرين على الأقل.', 'Account and cash account must be different.': 'يجب أن يختلف الحساب عن حساب الصندوق.',

  /* account types & chart of accounts */
  'Assets': 'الأصول', 'Liabilities': 'الخصوم', 'Equity': 'حقوق الملكية', 'Revenue': 'الإيرادات', 'Expenses': 'المصاريف', 'General': 'عام', 'Cash': 'نقدي', 'Bank': 'بنك',
  'Cash box': 'صندوق نقدي', 'Bank account': 'حساب بنكي', 'Bank Account': 'الحساب البنكي', 'Accounts Receivable': 'الذمم المدينة', 'VAT Receivable': 'ضريبة القيمة المضافة المستردة', 'Accounts Payable': 'الذمم الدائنة',
  'VAT Payable': 'ضريبة القيمة المضافة المستحقة', 'Owner Capital': 'رأس المال', 'Opening Balance Equity': 'حقوق ملكية الأرصدة الافتتاحية', 'Retained Earnings': 'الأرباح المحتجزة', 'Sales Revenue': 'إيرادات المبيعات',
  'Room Revenue': 'إيرادات الغرف', 'Other Income': 'إيرادات أخرى', 'Cost of Goods Sold': 'كلفة البضاعة المباعة', 'Waste & Spoilage': 'التلف والهدر', 'Inventory Adjustments': 'تسويات المخزون',
  'Salaries & Wages': 'الرواتب والأجور', 'Rent': 'الإيجار', 'Utilities': 'المرافق', 'Salesman Commission': 'عمولة المندوبين', 'General Expenses': 'مصاريف عامة', 'Cash Over / Short': 'زيادة / عجز الصندوق',
  'Walk-in Customer': 'عميل نقدي', 'system': 'نظامي', 'Expand / collapse': 'توسيع / طي', 'New account': 'حساب جديد', 'Kind': 'التصنيف', 'New customer': 'عميل جديد', 'New supplier': 'مورد جديد',
  'Edit customer': 'تعديل العميل', 'Edit supplier': 'تعديل المورد', 'Edit account': 'تعديل الحساب', 'Total receivable': 'إجمالي المستحق لك', 'Total payable': 'إجمالي المستحق عليك', 'With balance': 'لديهم رصيد',
  'Last invoice': 'آخر فاتورة', 'Credit limit': 'سقف الائتمان', 'Over limit': 'تجاوز السقف', 'New invoice': 'فاتورة جديدة', 'Credit limit (0 = none)': 'سقف الائتمان (0 = بلا سقف)', 'Default salesman': 'المندوب الافتراضي',
  'Opening balance (they owe you)': 'رصيد افتتاحي (مستحق لك)', 'Opening balance (you owe them)': 'رصيد افتتاحي (مستحق عليك)', 'Parent group': 'المجموعة الأم', '— Top level —': '— المستوى الأعلى —',
  'This is a group (header) account — it only totals its sub-accounts': 'حساب تجميعي — يجمع حساباته الفرعية فقط', 'Account saved': 'تم حفظ الحساب', 'Account deleted': 'تم حذف الحساب', 'Account deactivated': 'تم إلغاء تفعيل الحساب',
  'System accounts cannot be deleted. You can rename them.': 'لا يمكن حذف حسابات النظام، يمكنك إعادة تسميتها.', 'This account has sub-accounts.': 'لهذا الحساب حسابات فرعية.',
  'The walk-in customer is used by POS and cannot be deleted.': 'العميل النقدي مستخدم في نقطة البيع ولا يمكن حذفه.',

  /* statement & trial balance */
  '— Choose an account —': '— اختر حساباً —', 'Quick pick': 'اختيار سريع', 'Group accounts (totals)': 'الحسابات التجميعية (إجماليات)', 'Opening balance': 'الرصيد الافتتاحي', 'Total debit': 'إجمالي المدين',
  'Total credit': 'إجمالي الدائن', 'Closing balance': 'الرصيد الختامي', 'customer owes you': 'العميل مدين لك', 'credit balance': 'رصيد دائن', 'you owe supplier': 'أنت مدين للمورد', 'advance paid': 'دفعة مقدمة',
  'No transactions in this period.': 'لا توجد حركات في هذه الفترة.', 'Period debit': 'مدين الفترة', 'Period credit': 'دائن الفترة', 'Closing debit': 'مدين ختامي', 'Closing credit': 'دائن ختامي',
  'Detailed (all accounts)': 'تفصيلي (كل الحسابات)', 'Summary (main groups)': 'ملخّص (المجموعات الرئيسية)', 'Hide zero accounts': 'إخفاء الحسابات الصفرية', 'Opening balance': 'الرصيد الافتتاحي',
  'Click any account to open its statement for the same period. Group rows show the total of their sub-accounts.': 'اضغط على أي حساب لفتح كشفه للفترة نفسها. صفوف المجموعات تعرض إجمالي حساباتها الفرعية.',
  'Opening balance — ': 'رصيد افتتاحي — ',

  /* POS */
  'Search item or scan barcode  (F2)': 'ابحث عن مادة أو امسح الباركود  (F2)', 'Sell from warehouse': 'البيع من المستودع', 'No salesman': 'بدون مندوب', 'Hold': 'تعليق', 'Recall': 'استدعاء', 'PAY': 'ادفع',
  'Cart is empty': 'السلة فارغة', 'Cart is empty.': 'السلة فارغة.', 'Tap an item or scan a barcode': 'اضغط على مادة أو امسح الباركود', 'Exit POS': 'خروج من نقطة البيع', 'Amount due': 'المبلغ المستحق',
  'Card / bank': 'بطاقة / بنك', 'On account': 'على الحساب', 'Received in': 'العملة المستلمة', 'Amount received': 'المبلغ المستلم', 'Cash drawer': 'درج النقد', 'Exact': 'المبلغ تماماً', 'Still due': 'المتبقي',
  'Bank / card account': 'حساب البنك / البطاقة', 'Card / reference no.': 'رقم البطاقة / المرجع', 'Last 4 digits or ref': 'آخر 4 أرقام أو المرجع', 'Complete sale': 'إتمام البيع', 'Sale completed': 'تمّ البيع',
  'View invoice': 'عرض الفاتورة', 'Print receipt': 'طباعة الإيصال', 'Cart discount': 'خصم السلة', 'Discount type': 'نوع الخصم', 'Percent of subtotal': 'نسبة من المجموع', 'Hold order': 'تعليق الطلب',
  'Label (table, name…)': 'التسمية (طاولة، اسم…)', 'Held orders': 'الطلبات المعلّقة', 'No held orders.': 'لا توجد طلبات معلّقة.', 'Add items to the cart first.': 'أضف مواد إلى السلة أولاً.',
  'Clear the cart?': 'مسح السلة؟', 'Order held — recall it any time': 'تم تعليق الطلب — يمكنك استدعاؤه في أي وقت', 'Replace the current cart with this held order?': 'استبدال السلة الحالية بهذا الطلب المعلّق؟',
  'Replace': 'استبدال', 'No items match.': 'لا توجد مواد مطابقة.', 'Choose a named customer on the POS screen to sell on account.': 'اختر عميلاً محدداً في شاشة البيع للبيع على الحساب.',
  'Select a named customer for on-account sales.': 'اختر عميلاً محدداً للبيع على الحساب.', 'Amount received is less than the total. Use "On account" for partial payment.': 'المبلغ المستلم أقل من الإجمالي. استخدم "على الحساب" للدفع الجزئي.',
  'Pay now (optional)': 'ادفع الآن (اختياري)', 'Current balance': 'الرصيد الحالي', 'Unit price': 'سعر الوحدة', 'Discount %': 'الخصم %', 'Card': 'بطاقة', 'Discount cannot exceed the subtotal.': 'لا يمكن أن يتجاوز الخصم المجموع.',
  'Quantity must be greater than zero.': 'يجب أن تكون الكمية أكبر من صفر.', 'Not enough stock.': 'المخزون غير كافٍ.', 'Value': 'القيمة',

  /* rooms */
  'Room board': 'لوحة الغرف', 'Stay history': 'سجل الإقامات', 'Manage rooms': 'إدارة الغرف', 'Add room': 'إضافة غرفة', 'Occupied': 'مشغولة', 'Maintenance': 'صيانة', 'Floor': 'الطابق', 'Room': 'غرفة',
  'Standard': 'عادية', 'Twin': 'مزدوجة', 'Deluxe': 'فاخرة', 'Family': 'عائلية', 'Suite': 'جناح', 'Table': 'طاولة', 'VIP Table': 'طاولة VIP', 'night': 'ليلة', 'Check in': 'تسجيل الدخول',
  'Check-in': 'الدخول', 'Check-out': 'الخروج', 'Guest name': 'اسم النزيل', 'Guest': 'النزيل', 'Persons': 'الأشخاص', 'Bill to account': 'الفاتورة على حساب', 'Set maintenance': 'تحويل للصيانة',
  'Send to cleaning': 'إرسال للتنظيف', 'Mark available': 'تحديد كمتاحة', 'Room service / orders': 'خدمة الغرف / الطلبات', 'Add item — type code or name': 'أضف مادة — اكتب الرمز أو الاسم',
  'No orders yet.': 'لا توجد طلبات بعد.', 'Orders': 'الطلبات', 'Running bill (before tax)': 'الفاتورة الجارية (قبل الضريبة)', 'Move room': 'نقل الغرفة', 'Edit guest': 'تعديل النزيل', 'Check out': 'تسجيل الخروج',
  'Nights so far': 'الليالي حتى الآن', 'Checked in': 'وقت الدخول', 'Move guest': 'نقل النزيل', 'Move to room': 'نقل إلى غرفة', 'Move': 'نقل', 'Nights to charge': 'الليالي المحتسبة',
  'Check out & bill': 'خروج وإصدار فاتورة', 'Checkout complete': 'اكتمل تسجيل الخروج', 'Print invoice': 'طباعة الفاتورة', 'Room no. / name': 'رقم / اسم الغرفة', 'Floor / area': 'الطابق / المنطقة',
  'Capacity': 'السعة', 'Rate / night': 'السعر / ليلة', 'Room saved': 'تم حفظ الغرفة', 'No rooms match this filter.': 'لا توجد غرف مطابقة.', 'No completed stays yet.': 'لا توجد إقامات مكتملة بعد.',
  'Housekeeping is cleaning this room. Mark it ready when done.': 'يتم تنظيف هذه الغرفة. حدّدها كجاهزة عند الانتهاء.', 'This room is out of service for maintenance.': 'هذه الغرفة خارج الخدمة للصيانة.',
  'Room Charge (per night)': 'أجرة الغرفة (لليلة)', 'Delivery Fee': 'رسوم التوصيل', 'No available rooms.': 'لا توجد غرف متاحة.', 'Check the guest out first.': 'سجّل خروج النزيل أولاً.',
  'Guest name is required.': 'اسم النزيل مطلوب.', 'Nothing to bill — add nights or orders.': 'لا شيء للفوترة — أضف ليالي أو طلبات.', 'Choose an item.': 'اختر مادة.', 'Room': 'غرفة',

  /* salesmen */
  'New salesman': 'مندوب جديد', 'Edit salesman': 'تعديل المندوب', 'Commission %': 'العمولة %', 'Net sales': 'صافي المبيعات', 'Commission earned': 'العمولة المكتسبة', 'Commission paid': 'العمولة المدفوعة',
  'Commission due': 'العمولة المستحقة', 'Commission': 'العمولة', 'Pay commission': 'دفع العمولة', 'Commission % (of net sales)': 'العمولة % (من صافي المبيعات)', 'Net (excl. tax)': 'الصافي (بدون ضريبة)',
  'No sales in this period.': 'لا توجد مبيعات في هذه الفترة.', 'Salesman saved': 'تم حفظ المندوب', 'Performance': 'الأداء',

  /* cash box */
  'Cash in': 'إيداع نقدي', 'Cash out': 'سحب نقدي', 'Close shift': 'إغلاق الوردية', 'Closed shifts': 'الورديات المغلقة', 'Cash account': 'حساب النقد', 'Expected': 'المتوقع', 'Shift': 'الوردية', 'Closed': 'أُغلقت',
  'No cash movements on this day.': 'لا توجد حركات نقدية في هذا اليوم.', 'No shifts closed yet.': 'لم تُغلق أي وردية بعد.', 'Close shift — count the drawer': 'إغلاق الوردية — عدّ الدرج',
  'Expected (system balance)': 'المتوقع (رصيد النظام)', 'Counted total': 'إجمالي المعدود', 'Drawer balanced': 'الدرج متوازن', 'Cash over': 'زيادة نقدية', 'Cash short': 'عجز نقدي',
  'Transfer between cash accounts': 'تحويل بين حسابات النقد', 'Cash deposit to bank': 'إيداع نقدي في البنك', 'Movements for': 'الحركات بتاريخ', 'Closed at': 'وقت الإغلاق', 'Closed by': 'أغلقها',
  'Enter the counted amount.': 'أدخل المبلغ المعدود.', 'Choose two different accounts.': 'اختر حسابين مختلفين.', 'Enter an amount.': 'أدخل مبلغاً.', 'Count by denomination': 'العدّ حسب الفئة النقدية',

  /* reports */
  'Sales by day': 'المبيعات اليومية', 'Daily sales, tax and invoice count.': 'المبيعات اليومية والضريبة وعدد الفواتير.', 'Sales by item': 'المبيعات حسب المادة', 'Quantity sold, revenue, cost and profit per item.': 'الكمية المباعة والإيراد والكلفة والربح لكل مادة.',
  'Sales by customer': 'المبيعات حسب العميل', 'Revenue, payments and balances per customer.': 'الإيرادات والدفعات والأرصدة لكل عميل.', 'Sales by salesman': 'المبيعات حسب المندوب', 'Net sales and commission per salesman.': 'صافي المبيعات والعمولة لكل مندوب.',
  'Profit by invoice': 'الربح حسب الفاتورة', 'Gross profit of every sale after cost of goods.': 'إجمالي ربح كل عملية بيع بعد كلفة البضاعة.', 'Purchases by supplier': 'المشتريات حسب المورد', 'Purchases, payments and amounts owed per supplier.': 'المشتريات والدفعات والمبالغ المستحقة لكل مورد.',
  'Stock valuation': 'تقييم المخزون', 'Quantity, cost value and retail value of stock.': 'كمية المخزون وقيمته بالكلفة وبسعر البيع.', 'Low stock / reorder': 'المخزون المنخفض / إعادة الطلب', 'Items at or below their minimum quantity, with suggested order.': 'المواد عند الحد الأدنى أو دونه مع الكمية المقترحة.',
  'Item movement summary': 'ملخص حركة المواد', 'Opening, in, out and closing quantity per item for a period.': 'الكمية الافتتاحية والوارد والصادر والختامية لكل مادة في فترة.', 'Waste report': 'تقرير التلف', 'Damaged, expired and spoiled stock with value.': 'المخزون التالف والمنتهي والفاسد مع قيمته.',
  'Income statement (P&L)': 'قائمة الدخل (الأرباح والخسائر)', 'Revenue, cost of sales, expenses and net profit.': 'الإيرادات وكلفة المبيعات والمصاريف وصافي الربح.', 'Balance sheet': 'الميزانية العمومية', 'Assets, liabilities and equity as of a date.': 'الأصول والخصوم وحقوق الملكية في تاريخ معين.',
  'Expense breakdown': 'تفصيل المصاريف', 'Where the money went, by expense account.': 'أين صُرفت الأموال، حسب حساب المصروف.', 'Customer balances & aging': 'أرصدة العملاء وأعمار الديون', 'What each customer owes, split by invoice age.': 'المستحق على كل عميل مقسّماً حسب عمر الفاتورة.',
  'Supplier balances & aging': 'أرصدة الموردين وأعمار الديون', 'What you owe each supplier, split by invoice age.': 'المستحق لكل مورد مقسّماً حسب عمر الفاتورة.', 'Daily cash report': 'تقرير النقد اليومي', 'Cash and bank in / out per day with running balance.': 'الوارد والصادر النقدي والبنكي يومياً مع الرصيد الجاري.',
  'VAT / tax report': 'تقرير الضريبة', 'Output tax on sales, input tax on purchases, net payable by month.': 'ضريبة المبيعات وضريبة المشتريات وصافي المستحق شهرياً.',
  'Inventory': 'المخزون', 'Financial': 'مالية', 'Receivables & payables': 'الذمم المدينة والدائنة', 'Cash & tax': 'النقد والضريبة', 'Accounting': 'المحاسبة',
  'Debit and credit totals of every account.': 'إجماليات المدين والدائن لكل حساب.', 'Every transaction of one account with running balance.': 'كل حركات حساب واحد مع الرصيد الجاري.',
  'Net sales': 'صافي المبيعات', 'Daily average': 'المتوسط اليومي', 'Items sold': 'المواد المباعة', 'Revenue': 'الإيرادات', 'Gross profit': 'إجمالي الربح', 'Qty sold': 'الكمية المباعة', 'Profit': 'الربح',
  'Invoices': 'الفواتير', 'Collected': 'المحصّل', 'Unpaid': 'غير مدفوعة', 'Net revenue': 'صافي الإيراد', 'Cost of goods': 'كلفة البضاعة', 'Items in stock': 'المواد في المخزون', 'Cost value': 'القيمة بالكلفة',
  'Potential profit': 'الربح المحتمل', 'Items to reorder': 'مواد لإعادة الطلب', 'Estimated cost': 'الكلفة التقديرية', 'Create purchase for all': 'إنشاء فاتورة شراء للكل', 'Minimum': 'الحد الأدنى',
  'Suggested order': 'الكمية المقترحة', 'Est. cost': 'الكلفة التقديرية', 'Last supplier': 'آخر مورد', 'Order': 'طلب', 'Items moved': 'مواد متحركة', 'Total in': 'إجمالي الوارد', 'Total out': 'إجمالي الصادر',
  'Waste lines': 'أسطر التلف', 'Total value': 'القيمة الإجمالية', 'Expenses': 'المصاريف', 'Net profit': 'صافي الربح', 'Net loss': 'صافي الخسارة', 'Total revenue': 'إجمالي الإيرادات', 'Cost of sales': 'كلفة المبيعات',
  'Operating expenses': 'المصاريف التشغيلية', 'Total expenses': 'إجمالي المصاريف', 'Total assets': 'إجمالي الأصول', 'Equity + earnings': 'حقوق الملكية + الأرباح', 'Check': 'التحقق', 'Total liabilities': 'إجمالي الخصوم',
  'Current earnings (profit to date)': 'الأرباح الحالية (حتى تاريخه)', 'Total equity': 'إجمالي حقوق الملكية', 'Liabilities + equity': 'الخصوم + حقوق الملكية', 'Total expenses': 'إجمالي المصاريف',
  '0–30 days': '0–30 يوماً', '31–60 days': '31–60 يوماً', '61–90 days': '61–90 يوماً', '90+ days': 'أكثر من 90 يوماً', 'Over 60 days': 'أكثر من 60 يوماً', 'Unapplied': 'غير مخصص',
  'Cash in': 'إيداع نقدي', 'Cash out': 'سحب نقدي', 'Output VAT (sales)': 'ضريبة المبيعات', 'Input VAT (purchases)': 'ضريبة المشتريات', 'Net VAT payable': 'صافي الضريبة المستحقة', 'Net VAT refundable': 'صافي الضريبة المستردة',
  'Month': 'الشهر', 'Output VAT': 'ضريبة المبيعات', 'Input VAT': 'ضريبة المشتريات', 'Net payable': 'صافي المستحق', 'Rate %': 'النسبة %', 'Accounts': 'الحسابات', 'Share': 'الحصة', 'Unpaid': 'غير مدفوعة',
  'No data for this period.': 'لا توجد بيانات لهذه الفترة.', 'Beginning': 'البداية', 'Total': 'الإجمالي', 'Customer': 'العميل', 'Waste': 'تلف',

  /* users, settings, backup, tasks */
  'Administrator': 'مسؤول النظام', 'Accountant': 'محاسب', 'Store keeper': 'أمين المستودع', 'Custom': 'مخصص', 'New user': 'مستخدم جديد', 'Activity log': 'سجل النشاط', 'Access': 'الصلاحيات',
  'All modules': 'كل الوحدات', 'Disabled': 'معطّل', 'Module permissions': 'صلاحيات الوحدات', 'Select all': 'تحديد الكل', 'Clear all': 'إلغاء الكل', 'Active (can log in)': 'نشط (يمكنه الدخول)',
  'Reset password': 'إعادة تعيين كلمة المرور', 'User saved': 'تم حفظ المستخدم', 'Password reset': 'تمت إعادة تعيين كلمة المرور', 'No activity yet.': 'لا يوجد نشاط بعد.',
  'Company': 'الشركة', 'Company name': 'اسم الشركة', 'Tax / VAT number': 'الرقم الضريبي', 'Sales & invoices': 'المبيعات والفواتير', 'Default tax rate %': 'نسبة الضريبة الافتراضية %',
  'Walk-in (cash) customer': 'العميل النقدي', 'Default warehouse': 'المستودع الافتراضي', 'Default cash account': 'حساب النقد الافتراضي', 'Invoice footer': 'تذييل الفاتورة',
  'Allow selling more than the available stock (negative stock)': 'السماح بالبيع بأكثر من المخزون المتوفر (مخزون سالب)', 'Show low-stock alerts in notifications': 'إظهار تنبيهات المخزون المنخفض في الإشعارات',
  'Appearance': 'المظهر', 'Dark mode': 'الوضع الداكن', 'Quick links': 'روابط سريعة', 'Users & permissions': 'المستخدمون والصلاحيات', 'Backup & restore': 'النسخ والاستعادة', 'Currencies & rates': 'العملات والأسعار',
  'Save settings': 'حفظ الإعدادات', 'Settings saved': 'تم حفظ الإعدادات', 'Theme changed': 'تم تغيير السمة', 'Emerald & Amber': 'زمردي وكهرماني', 'Plum & Coral': 'برقوقي ومرجاني', 'Forest & Lime': 'أخضر غابي وليموني',
  'Graphite & Orange': 'رمادي وبرتقالي', 'Language': 'اللغة', 'Company name is required.': 'اسم الشركة مطلوب.',
  'Download backup': 'تنزيل نسخة احتياطية', 'Download backup file': 'تنزيل ملف النسخة الاحتياطية', 'Restore from file': 'استعادة من ملف', 'Choose backup file…': 'اختر ملف النسخة…',
  'Replace all current data with a backup file. A safety snapshot is taken first.': 'استبدال كل البيانات الحالية بملف نسخة احتياطية. تُؤخذ لقطة أمان أولاً.', 'Local snapshots (last 5)': 'اللقطات المحلية (آخر 5)',
  'Create snapshot now': 'إنشاء لقطة الآن', 'Danger zone': 'منطقة الخطر', 'Reset to demo data': 'إعادة بيانات العرض', 'Start fresh (empty company)': 'البدء من جديد (شركة فارغة)',
  'Both actions take a snapshot first, so you can undo from the list above.': 'كلا الإجراءين يأخذ لقطة أولاً، فيمكنك التراجع من القائمة أعلاه.', 'Taken': 'وقت الالتقاط', 'Size': 'الحجم',
  'No snapshots yet. Automated tasks can create one daily.': 'لا توجد لقطات بعد. يمكن للمهام التلقائية إنشاء لقطة يومياً.', 'Snapshot created': 'تم إنشاء اللقطة', 'Snapshot deleted': 'تم حذف اللقطة',
  'Data restored': 'تمت استعادة البيانات', 'Backup downloaded': 'تم تنزيل النسخة', 'Demo data loaded': 'تم تحميل بيانات العرض', 'Empty company ready': 'الشركة الفارغة جاهزة', 'Manual snapshot': 'لقطة يدوية',
  'This is not a valid Devma backup.': 'هذا ليس ملف نسخة احتياطية صالحاً لديفما.', 'Could not read the file.': 'تعذّرت قراءة الملف.', 'Replace all data with the demo company?': 'استبدال كل البيانات بشركة العرض؟',
  'Erase ALL items, accounts, invoices and stock and start an empty company? Users and settings are kept.': 'مسح كل المواد والحسابات والفواتير والمخزون والبدء بشركة فارغة؟ يُحتفظ بالمستخدمين والإعدادات.',
  'Erase everything': 'مسح كل شيء',
  'Run all due now': 'تشغيل المستحق الآن', 'New task': 'مهمة جديدة', 'Run history': 'سجل التشغيل', 'Task': 'المهمة', 'Repeat': 'التكرار', 'Last run': 'آخر تشغيل', 'Next run': 'التشغيل التالي',
  'Last result': 'آخر نتيجة', 'Due now': 'مستحقة الآن', 'Hourly': 'كل ساعة', 'Daily': 'يومياً', 'Weekly': 'أسبوعياً', 'Monthly': 'شهرياً', 'Every hour': 'كل ساعة', 'Every day': 'كل يوم',
  'Every week': 'كل أسبوع', 'Every 30 days': 'كل 30 يوماً', 'New automated task': 'مهمة تلقائية جديدة', 'Edit task': 'تعديل المهمة', 'Task name': 'اسم المهمة', 'Expense account': 'حساب المصروف',
  'Voucher description': 'بيان السند', 'Task saved': 'تم حفظ المهمة', 'Auto Backup Snapshot': 'لقطة نسخ احتياطي تلقائية', 'Low Stock Alert': 'تنبيه المخزون المنخفض', 'Recurring Expense Voucher': 'سند مصروف متكرر',
  'Daily Sales Summary': 'ملخص المبيعات اليومي', 'Daily local backup': 'نسخة محلية يومية', 'Low stock check': 'فحص المخزون المنخفض', 'Monthly shop rent': 'إيجار المحل الشهري', 'Daily sales summary': 'ملخص المبيعات اليومي',
  'Tasks have not run yet.': 'لم تُشغَّل المهام بعد.', 'No tasks yet.': 'لا توجد مهام بعد.', 'No tasks are due right now.': 'لا توجد مهام مستحقة الآن.', 'Failed': 'فشل', 'Turn on/off': 'تشغيل / إيقاف',
  'Local snapshot created.': 'تم إنشاء لقطة محلية.', 'All items above minimum.': 'كل المواد فوق الحد الأدنى.', 'Welcome to Devma': 'مرحباً بك في ديفما',
  'Demo data is loaded. Explore every module, or reset from Backup.': 'تم تحميل بيانات العرض. استكشف كل الوحدات أو أعد التعيين من النسخ الاحتياطي.',
  'Due tasks run automatically while Devma is open (checked every minute and at login).': 'تعمل المهام المستحقة تلقائياً أثناء فتح ديفما (فحص كل دقيقة وعند الدخول).',
  'Saves a local snapshot of all data (the last 5 are kept).': 'يحفظ لقطة محلية لكل البيانات (يُحتفظ بآخر 5).', 'Checks every item against its minimum quantity and sends a notification.': 'يفحص كل مادة مقابل حدها الأدنى ويرسل إشعاراً.',
  'Creates a payment voucher automatically — e.g. rent, internet, subscriptions.': 'ينشئ سند دفع تلقائياً — مثل الإيجار والإنترنت والاشتراكات.', "Posts a notification with today's sales count and total.": 'يرسل إشعاراً بعدد مبيعات اليوم وإجماليها.',

  /* about */
  'Version 1.0 · ERP edition': 'الإصدار 1.0 · نسخة ERP', 'Your data': 'بياناتك', 'Journal entries': 'قيود اليومية', 'Stock movements': 'حركات المخزون', 'Keyboard shortcuts': 'اختصارات لوحة المفاتيح',
  'POS: focus search / barcode': 'نقطة البيع: التركيز على البحث / الباركود', 'POS: pay': 'نقطة البيع: الدفع', 'POS: add scanned barcode · Search: open first result': 'نقطة البيع: إضافة الباركود الممسوح · البحث: فتح أول نتيجة',
  'Close dialog': 'إغلاق النافذة', 'Support': 'الدعم', 'Check system integrity': 'فحص سلامة النظام', 'System integrity': 'سلامة النظام', 'Ledger debits = credits': 'مدين الدفتر = دائنه',
  'Inventory account vs stock value': 'حساب المخزون مقابل قيمة المخزون', 'Orphan journal entries': 'قيود يتيمة', 'Mismatch': 'غير متطابق', 'Differs': 'مختلف',
  'Devma is a complete point-of-sale, inventory and double-entry accounting system. Every sale, purchase, voucher and stock movement posts automatically to the general ledger, so the trial balance, account statements and financial reports are always up to date.': 'ديفما نظام متكامل لنقطة البيع والمخزون والمحاسبة بالقيد المزدوج. كل عملية بيع وشراء وسند وحركة مخزون تُرحَّل تلقائياً إلى دفتر الأستاذ، لذا يبقى ميزان المراجعة وكشوف الحسابات والتقارير المالية محدّثة دائماً.',
  'Point of sale with hold/recall, barcode entry and multi-currency tender': 'نقطة بيع مع تعليق/استدعاء وإدخال بالباركود ودفع بعملات متعددة', 'Rooms / tables board with check-in, room service and checkout billing': 'لوحة غرف / طاولات مع الدخول وخدمة الغرف وفوترة الخروج',
  'Sales, purchases and returns with partial payments': 'مبيعات ومشتريات ومرتجعات مع دفعات جزئية', 'Receipt, payment and journal vouchers': 'سندات قبض ودفع وقيود يومية',
  'Warehouses, transfers, stock counts, waste and opening stock': 'مستودعات وتحويلات وجرد وتلف وبضاعة أول المدة', 'Production recipes (bill of materials) and disassembling': 'وصفات إنتاج (قائمة مواد) وتفكيك',
  'Trial balance, account statements, P&L, balance sheet and 16 reports': 'ميزان مراجعة وكشوف حسابات وقائمة دخل وميزانية و16 تقريراً', 'Users with role permissions, audit log, backups and automated tasks': 'مستخدمون بصلاحيات وسجل نشاط ونسخ احتياطي ومهام تلقائية',
  'Totals (posting accounts)': 'الإجماليات (حسابات الترحيل)', 'Record payment': 'تسجيل دفعة', 'all ledgers are kept in': 'تُمسك جميع الدفاتر بـ', 'unit cost': 'كلفة الوحدة',
  '— Select account —': '— اختر حساباً —', '— Select customer —': '— اختر عميلاً —', '— Select supplier —': '— اختر مورداً —', '— Select —': '— اختر —', 'About': 'حول', 'Beirut': 'بيروت', 'Lebanon': 'لبنان',
  'item': 'مادة', 'Auto': 'تلقائي', 'Download': 'تنزيل', 'Balanced ✓': 'متوازن ✓', 'Initial shop stocking': 'تعبئة أولية للمحل', 'Base currency': 'العملة الأساسية',
  'A small inventory difference can appear after editing old purchase invoices because item costs use a moving average.': 'قد يظهر فرق بسيط في المخزون بعد تعديل فواتير شراء قديمة لأن كلفة المواد تعتمد المتوسط المتحرك.',
};
/* single words / short labels that are also safe to replace inside longer sentences */
const AR_PHRASE_WORDS = ['Barcode', 'Salesman', 'Rent', 'Utilities', 'Inventory', 'Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses', 'Cash', 'Bank', 'Supplier', 'Beirut', 'Lebanon', 'Auto', 'Room', 'night', 'Keeper', 'Cashier', 'Warehouse', 'Currency', 'Customer', 'Status', 'Balance', 'Total', 'Subtotal', 'Paid', 'Change', 'Opening', 'Closing', 'Tax', 'Discount', 'Commission', 'Performance', 'Shift', 'Payment', 'Expired', 'Damaged', 'Standard', 'Deluxe', 'Twin', 'Family', 'Suite', 'Created', 'Updated', 'Deleted', 'Return', 'Sales', 'Purchases', 'Items', 'Rate', 'Receipt'];

const I18N = {
  lang: (() => { try { return localStorage.getItem('devma_lang') || 'en'; } catch (e) { return 'en'; } })(),
  cache: new Map(),
  get ar() { return this.lang === 'ar'; },
  loc() { return this.ar ? 'ar-LB-u-nu-latn' : 'en-GB'; },
  apply() { const h = document.documentElement; h.lang = this.lang; h.dir = this.ar ? 'rtl' : 'ltr'; },
  set(lang) {
    this.lang = lang; try { localStorage.setItem('devma_lang', lang); } catch (e) {}
    this.apply(); document.getElementById('modal-root').innerHTML = '';
    if (window.App && App.user) App.shell(); else if (window.App) App.loginScreen();
  },
  toggle() { this.set(this.ar ? 'en' : 'ar'); },
  rx: null,
  phraseRx() {
    if (this.rx) return this.rx;
    const keys = Object.keys(AR).filter(k => /[A-Za-z]{3}/.test(k) && (k.includes(' ') || AR_PHRASE_WORDS.includes(k))).sort((a, b) => b.length - a.length);
    const esc = k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    this.rx = new RegExp('(?<![A-Za-z])(' + keys.map(esc).join('|') + ')(?![A-Za-z])', 'g');
    return this.rx;
  },
  /* dynamic sentences: [pattern, replacement-fn] */
  RULES: [
    [/^(\d+) records?$/, m => `${m[1]} سجل`],
    [/^Page (\d+) of (\d+)$/, m => `صفحة ${m[1]} من ${m[2]}`],
    [/^Floor (.+)$/, m => `الطابق ${m[1]}`],
    [/^(.+) (▲|▼)$/, m => I18N.tr(m[1]) + ' ' + m[2]],
    [/^min (.+)$/, m => `الحد الأدنى ${m[1]}`], [/^margin (.+)$/, m => `الهامش ${m[1]}`], [/^Exact (.+)$/, m => `المبلغ تماماً ${m[1]}`],
    [/^Save a complete copy of all data \((.+)\) to a file\. Keep it on a USB drive or cloud folder\.$/, m => `احفظ نسخة كاملة من كل البيانات (${m[1]}) في ملف، واحتفظ بها على ذاكرة USB أو مجلد سحابي.`],
    [/^Storage used: (.+) in this browser\.$/, m => `المساحة المستخدمة: ${m[1]} في هذا المتصفح.`],
    [/^Created (.+) by (.+)$/, m => `أُنشئ ${m[1]} بواسطة ${m[2]}`],
    [/^(\d+) invoice\(s\)$/, m => `${m[1]} فاتورة`],
    [/^(\d+) item\(s\)$/, m => `${m[1]} مادة`],
    [/^(\d+) line\(s\)(.*)$/, m => `${m[1]} سطر` + I18N.tr(m[2])],
    [/^since (.+)$/, m => `منذ ${m[1]}`],
    [/^Good (morning|afternoon|evening), (.+)$/, m => `${m[1] === 'morning' ? 'صباح الخير' : 'مساء الخير'}، ${m[2]}`],
    [/^(\d+) min ago$/, m => `منذ ${m[1]} دقيقة`], [/^(\d+) h ago$/, m => `منذ ${m[1]} ساعة`], [/^(\d+) d ago$/, m => `منذ ${m[1]} يوم`],
    [/^Devma ERP System v1\.0 — (.+)$/, m => `نظام ديفما ERP v1.0 — ⁦${m[1]}⁩`],
    [/^© (\d+) Devma Accounting System v1\.0$/, m => `© ${m[1]} ديفما للمحاسبة v1.0`],
    [/^(.+) \*$/, m => I18N.tr(m[1]) + ' *'],
    [/^(.+) →$/, m => I18N.tr(m[1]) + ' ←'],
    [/^(.+):$/, m => I18N.tr(m[1]) + ':'],
    [/^(\d+) night\(s\)(.*)$/, m => `${m[1]} ليلة` + I18N.tr(m[2])],
    [/^Rate \(per 1 (\w+)\)$/, m => `السعر (لكل 1 ${m[1]})`], [/^1 unit in (\w+)$/, m => `قيمة الوحدة بـ ${m[1]}`],
    [/^Rate per night \((\w+)\)$/, m => `سعر الليلة (${m[1]})`], [/^In (\w{3})$/, m => `بعملة ${m[1]}`], [/^Total \((\w{3})\)$/, m => `الإجمالي (${m[1]})`],
    [/^(.+) \(([A-Z]{3})\)$/, m => I18N.tr(m[1]) + ` (${m[2]})`],
    [/^(Amount received now|Amount paid now) \((\w{3})\)$/, m => I18N.tr(m[1]) + ` (${m[2]})`],
    [/^(.+?) ([A-Z]{2,4}-\d{3,5}) (saved|posted|completed)$/, m => `${I18N.tr(m[1])} ${m[2]} — ${{ saved: 'تم الحفظ', posted: 'تم الترحيل', completed: 'اكتمل' }[m[3]]}`],
    [/^Not enough stock for "(.+)" in (.+) \(available (.+), needed (.+)\)\.$/, m => `المخزون غير كافٍ من "${m[1]}" في ${I18N.tr(m[2])} (المتوفر ${m[3]}، المطلوب ${m[4]}).`],
    [/^(\d+) sale\(s\) today, total (.+)\.$/, m => `${m[1]} عملية بيع اليوم، الإجمالي ${m[2]}.`],
    [/^(\d+) item\(s\) at or below minimum\.$/, m => `${m[1]} مادة عند الحد الأدنى أو دونه.`],
    [/^(\d+) item\(s\) low on stock$/, m => `${m[1]} مادة مخزونها منخفض`],
    [/^(\d+) task\(s\) ran$/, m => `تم تشغيل ${m[1]} مهمة`],
    [/^(\d+) of (\d+) modules$/, m => `${m[1]} من ${m[2]} وحدة`],
    [/^(\d+) reports — click any report, then click any row to drill down to the source\.$/, m => `${m[1]} تقريراً — اضغط على أي تقرير ثم على أي صف للوصول إلى المصدر.`],
    [/^(\d+) items in (\d+) categories$/, m => `${m[1]} مادة في ${m[2]} فئة`],
    [/^Delete (.+)\?(.*)$/, m => `حذف ${I18N.tr(m[1])}؟` + (m[2] ? ' ' + I18N.tr(m[2].trim()) : '')],
    [/^(\d+) item\(s\)(.*)$/, m => `${m[1]} مادة` + I18N.tr(m[2])],
    [/^Edit (.+)$/, m => 'تعديل ' + I18N.tr(m[1])],
    [/^New (.+)$/, m => I18N.tr(m[1]) + ' جديد'],
    [/^(.+?) — (.+)$/, m => I18N.tr(m[1]) + ' — ' + I18N.tr(m[2])],
    [/^(.+?) ([A-Z]{2,4}-\d{3,5})$/, m => I18N.tr(m[1]) + ' ' + m[2]],
  ],
  tr(s) {
    if (!this.ar || !s) return s;
    const t = s.trim(); if (!t || !/[A-Za-z]/.test(t)) return s;
    if (this.cache.has(t)) return s.replace(t, this.cache.get(t));
    let r = AR[t];
    if (r === undefined) for (const [rx, fn] of this.RULES) { const m = t.match(rx); if (m) { r = fn(m); break; } }
    if (r === undefined) r = t.replace(this.phraseRx(), k => AR[k]);
    r = r.replace(/→/g, '←');
    if (this.cache.size > 5000) this.cache.clear();
    this.cache.set(t, r);
    return s.replace(t, r);
  },
  SKIP: new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'KBD', 'DATALIST', 'svg']),
  ATTRS: ['placeholder', 'title', 'aria-label', 'label'],
  translate(root) {
    if (!this.ar || !root) return;
    if (root.nodeType === 3) { const p = root.parentNode; if (p && !this.skip(p)) { const v = this.iso(this.tr(root.nodeValue)); if (v !== root.nodeValue) root.nodeValue = v; } return; }
    if (root.nodeType !== 1 || this.skip(root)) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, { acceptNode: n => n.nodeType === 1 && this.skip(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    let n = root;
    do {
      if (n.nodeType === 3) { const v = this.iso(this.tr(n.nodeValue)); if (v !== n.nodeValue) n.nodeValue = v; }
      else this.ATTRS.forEach(a => { if (n.hasAttribute(a) && !(a === 'label' && n.tagName !== 'OPTGROUP')) { const o = n.getAttribute(a), v = this.tr(o); if (v !== o) n.setAttribute(a, v); } });
    } while ((n = w.nextNode()));
  },
  /* keep Latin / numeric runs (codes, prices, phones, "9 pcs") in left-to-right order inside RTL pages */
  iso(v) { return v && v.trim() && v[0] !== '⁦' && !/[؀-ۿ]/.test(v) && /[A-Za-z0-9]/.test(v) ? '⁦' + v + '⁩' : v; },
  skip(el) { return this.SKIP.has(el.nodeName) || (el.classList && (el.classList.contains('mono') || el.classList.contains('no-tr'))); },
  start() {
    this.apply();
    new MutationObserver(muts => { if (!this.ar) return; muts.forEach(m => m.addedNodes.forEach(n => this.translate(n))); }).observe(document.body, { childList: true, subtree: true });
    if (this.ar) this.translate(document.body);
  },
};
I18N.apply();
window.addEventListener('DOMContentLoaded', () => I18N.start());
