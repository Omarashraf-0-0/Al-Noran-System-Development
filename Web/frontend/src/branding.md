# 🎨 Al-Noran Premium Design System v2.0

> **دليل التصميم الموحد** - مرجع شامل لجميع صفحات النظام

---

## 📌 Quick Reference

| Element | Pattern |
|---------|---------|
| **Page Background** | `bg-[#F8FAFC]` + World Map Watermark + Ambient Orbs |
| **Card Style** | `bg-white/70 backdrop-blur-xl rounded-[2rem] border-white/60` |
| **Accent Stripe** | `bg-gradient-to-r from-[#690000] via-[#8B0000] to-[#1BA3B6]` |
| **Primary Button** | `bg-[#690000] hover:bg-[#800000] shadow-lg shadow-[#690000]/20` |
| **Direction** | `dir="rtl"` on root container |

---

## 🏗️ Page Structure Template

```jsx
<div className="flex flex-col min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#690000] selection:text-white relative" dir="rtl">
  
  {/* 🌍 Global Background */}
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-[#eef2f6]"></div>
    <div className="absolute top-[10%] left-0 w-full h-full opacity-[0.03] bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')] bg-no-repeat bg-center bg-contain"></div>
    <div className="absolute top-[-20%] right-[-10%] w-[900px] h-[900px] bg-[#690000]/5 rounded-full blur-[120px] animate-pulse"></div>
    <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-[#1BA3B6]/5 rounded-full blur-[120px] animate-pulse delay-1000"></div>
  </div>

  <div className="relative z-10 flex-grow flex flex-col">
    <Header />
    
    <main className="w-full max-w-6xl mx-auto px-6 pt-12 pb-20 flex-grow">
      {/* Page Content */}
    </main>
    
    <Footer />
  </div>
</div>
```

---

## 🃏 Card Styles

### Hero Card (Main Dashboard Card)
```jsx
<div className="relative mb-6 bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_10px_30px_rgba(0,0,0,0.04)] rounded-[2rem] p-6 lg:p-8 overflow-hidden hover:shadow-[0_20px_40px_rgba(105,0,0,0.08)] transition-all duration-500 group transform hover:-translate-y-0.5">
  
  {/* Hover Glow Effect */}
  <div className="absolute inset-0 bg-gradient-to-tr from-white/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
  
  {/* Accent Stripe */}
  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#690000] via-[#8B0000] to-[#1BA3B6]"></div>
  
  {/* Content */}
</div>
```

### Standard Card
```jsx
<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
  {/* Content */}
</div>
```

### Interactive Card (Shipment Card Style)
```jsx
<a className="group relative bg-white rounded-[1.5rem] p-1 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block border border-gray-200/60">
  
  {/* Holographic Border on Hover */}
  <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-r from-[#690000] via-[#1BA3B6] to-[#690000] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[2px] -z-10"></div>
  
  <div className="bg-white rounded-[1.3rem] p-6 h-full group-hover:bg-gradient-to-br from-white to-gray-50 transition-colors">
    {/* Content */}
  </div>
</a>
```

---

## 🎛️ Sticky Control Bar (Filter/Sort)

```jsx
<div className="sticky top-32 z-40 bg-white border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-2xl p-4 flex flex-col lg:flex-row items-center gap-4 mb-8 transition-all duration-300">
  
  {/* Filter Tabs */}
  <div className="flex p-1 bg-gray-100/50 rounded-xl min-w-max gap-1">
    <button className="px-5 py-2 rounded-lg text-xs font-bold bg-[#690000] text-white shadow-lg shadow-red-900/20">
      Active Tab
    </button>
    <button className="px-5 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-white hover:shadow-sm">
      Inactive Tab
    </button>
  </div>
  
  {/* Search Input */}
  <div className="relative flex-1 max-w-md">
    <Search className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
    <input className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-2.5 pr-10 pl-4 focus:bg-white focus:ring-2 focus:ring-[#690000]/10 focus:border-[#690000] outline-none transition-all text-sm font-medium" />
  </div>
  
</div>
```

---

## 🔘 Buttons

### Primary
```jsx
<button className="bg-[#690000] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-[#690000]/20 hover:bg-[#800000] hover:shadow-xl active:scale-95 transition-all">
  Primary Action
</button>
```

### Secondary (Teal)
```jsx
<button className="bg-[#1BA3B6] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-[#1BA3B6]/20 hover:bg-[#158a9a] active:scale-95 transition-all">
  Secondary Action
</button>
```

### Outline
```jsx
<button className="border border-[#690000] text-[#690000] px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#690000] hover:text-white active:scale-95 transition-all">
  Outline
</button>
```

### Ghost
```jsx
<button className="text-gray-600 hover:text-[#690000] hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-bold transition-all">
  Ghost
</button>
```

---

## 🏷️ Status Badges

```jsx
// Completed / Success
<span className="px-4 py-1.5 rounded-full text-xs font-bold border border-green-500 bg-green-50 text-green-700">
  مكتملة
</span>

// Active / In Progress
<span className="px-4 py-1.5 rounded-full text-xs font-bold border border-blue-500 bg-blue-50 text-blue-700">
  نشطة
</span>

// Pending / Warning
<span className="px-4 py-1.5 rounded-full text-xs font-bold border border-amber-500 bg-amber-50 text-amber-700">
  قيد الانتظار
</span>

// Rejected / Error
<span className="px-4 py-1.5 rounded-full text-xs font-bold border border-red-500 bg-red-50 text-red-700">
  مرفوض
</span>
```

---

## 📊 Stats Card

```jsx
<button className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-red-50 bg-opacity-50 transition-all hover:scale-105 w-full text-right group hover:bg-white hover:shadow-md cursor-pointer">
  <div className="p-3 rounded-xl bg-white shadow-sm text-[#690000]">
    <Package className="w-6 h-6" />
  </div>
  <div>
    <h4 className="text-2xl font-bold text-gray-800">42</h4>
    <p className="text-xs text-gray-500 font-medium group-hover:text-[#690000]/80 transition-colors">إجمالي الشحنات</p>
  </div>
</button>
```

---

## 📝 Form Inputs

```jsx
// Text Input
<input
  className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-2.5 px-4 focus:bg-white focus:ring-2 focus:ring-[#690000]/10 focus:border-[#690000] outline-none transition-all text-sm font-medium"
  placeholder="..."
/>

// Select Dropdown
<select className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-2.5 px-4 focus:bg-white focus:ring-2 focus:ring-[#690000]/10 focus:border-[#690000] outline-none transition-all text-sm font-medium appearance-none">
  <option>خيار</option>
</select>

// Textarea
<textarea className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3 px-4 focus:bg-white focus:ring-2 focus:ring-[#690000]/10 focus:border-[#690000] outline-none transition-all text-sm font-medium resize-none" rows={4}></textarea>
```

---

## 🎨 Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| **Maroon** | `#690000` | Primary brand, buttons, active states |
| **Dark Maroon** | `#8B0000` | Hover states, gradients |
| **Teal** | `#1BA3B6` | Secondary accent, info |
| **Page BG** | `#F8FAFC` | Main background |
| **Card BG** | `white/70` | Glassmorphic cards |

---

## ✨ Effects

### Glassmorphism
```jsx
bg-white/70 backdrop-blur-xl border border-white/60
```

### Premium Shadow
```jsx
shadow-[0_10px_30px_rgba(0,0,0,0.04)]
// Hover:
hover:shadow-[0_20px_40px_rgba(105,0,0,0.08)]
```

### Floating Container
```jsx
sticky top-3 mx-3 md:mx-6 rounded-2xl
```

### Glow Effect
```jsx
shadow-lg shadow-[#690000]/20
```

---

## ✅ Page Checklist

When building/updating a page, ensure:

- [ ] Uses RTL layout (`dir="rtl"`)
- [ ] Has global background with world map + orbs
- [ ] Uses `max-w-6xl mx-auto` container
- [ ] Cards use glassmorphism + accent stripe
- [ ] Buttons use proper primary/secondary styles
- [ ] Status badges use correct color coding
- [ ] Sticky elements account for Header offset (`top-32`)
- [ ] Has hover effects and transitions
- [ ] Loading states with skeleton UI
- [ ] Empty states with friendly messaging
- [ ] Uses Lucide icons (not emojis)
