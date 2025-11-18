import React from 'react';
import EmployeeForm from '../components/EmployeeForm';
import TransactionTable from "../components/TransactionTable.jsx";

const EmployeeManagement = () => {
	return (
		<div className="bg-gray-50 min-h-screen text-gray-800">
			<div className="container mx-auto p-4 sm:p-6 lg:p-8">
				<h1 className="text-2xl font-bold mb-6">Employee Management</h1>
				<div className="space-y-8">
					<EmployeeForm />
					<TransactionTable />
				</div>
			</div>
		</div>
	);
};

export default EmployeeManagement;
