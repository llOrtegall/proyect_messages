const colors = ['bg-red-700', 'bg-green-700', 'bg-blue-700', 'bg-yellow-700', 'bg-pink-700', 'bg-purple-700', 'bg-orange-700', 'bg-cyan-700', 'bg-teal-700', 'bg-indigo-700']

const userId = (id: string) => parseInt(id, 16);

export const Avatar = ({ initialString, id, online }: { initialString: string, id: string, online: boolean }) => {
  const colorIndex = userId(id) % colors.length;
  const color = colors[colorIndex];

  return (
    <div className={`${color} size-8  rounded-full text-center flex items-center justify-center uppercase font-semibold  text-xl text-white shadow-md relative`}>
      {initialString}
      {online === true ? (
        <span className='size-3 absolute bottom-0 right-0 rounded-full bg-green-500 shadow-md border-white border-2'></span>
      ) : (
        <span className='size-3 absolute bottom-0 right-0 rounded-full bg-gray-500 shadow-md border-white border-2'></span>
      )}
    </div>
  )
} 