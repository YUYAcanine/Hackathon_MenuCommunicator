import React from 'react'

type LoadingProps = {
  message: string;
};

const Loading: React.FC<LoadingProps> = ({ message }) => {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
            <div className="h-12 w-12 border-4 border-t-transparent border-white rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-medium text-white">{message}</p>
        </div>
    );
};

export default Loading;
