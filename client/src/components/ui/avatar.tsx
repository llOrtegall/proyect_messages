const colors = ['bg-red-700', 'bg-green-700', 'bg-blue-700', 'bg-yellow-700', 'bg-pink-700', 'bg-purple-700', 'bg-orange-700', 'bg-cyan-700', 'bg-teal-700', 'bg-indigo-700']

const userId = (id: string) => parseInt(id, 16);

export const Avatar = ({ initialString, id }: { initialString: string, id: string }) => {
  const colorIndex = userId(id) % colors.length;
  const color = colors[colorIndex];

  return (
    <div className={`${color} size-8  rounded-full text-center flex items-center justify-center uppercase font-semibold  text-xl pb-0.5 text-white shadow-md`}>
      {initialString}
    </div>
  )
} 