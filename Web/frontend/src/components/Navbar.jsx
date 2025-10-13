import React from 'react'

const Navbar = () => {
  return (
    <>
        <header className="bg-[#1BA3B6] text-white p-4">
            
            <img src="src/assets/images/logo.png" alt="Logo" className="h-8 inline-block mr-4" />
            <nav className="inline-block mr-4">
                <span className="text-xl mr-12">الدعم</span>
                <span className='text-xl mr-12'> تتبع الشحنه </span>
                <span className='text-xl mr-12'> الشحن</span>
            </nav>
        </header>
    </>
  )
}

export default Navbar