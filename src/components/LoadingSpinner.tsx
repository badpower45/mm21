export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]" dir="rtl">
      <div className="text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-[#0B69FF] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-600">جاري التحميل...</p>
      </div>
    </div>
  );
}
