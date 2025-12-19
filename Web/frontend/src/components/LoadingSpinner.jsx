const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center h-full">
      <div className="border-t-4 border-b-4 border-blue-500 rounded-full w-16 h-16 animate-spin"></div>
    </div>
  );
};

export default LoadingSpinner;
