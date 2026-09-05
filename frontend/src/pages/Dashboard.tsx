import EmployeeList from "../components/EmployeeList";

export default function Dashboard() {
    return (
        <div className=" mx-auto px-0  ">
            <div className="mb-6 pt-7 pl-5">
                <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
                <p className="text-gray-500 text-sm mt-1">
                    Manage your organization's workforce
                </p>
            </div>

            <div className=" border-gray-200 px-6 pb-6">
                <EmployeeList />
            </div>
        </div>
    );
}
