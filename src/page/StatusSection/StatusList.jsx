import React from 'react'
import formatTimestamp from '../../utils/formatTime'

const StatusList = ({ statusContacts, onSelect, theme }) => {
  console.log("StatusList received statusContacts:", statusContacts);

  if (!Array.isArray(statusContacts)) {
    console.warn("StatusList: statusContacts is not an array", statusContacts);
    return null;
  }

  const safeContacts = statusContacts.filter(c => c && typeof c === 'object');

  if (safeContacts.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      {safeContacts.map((contact) => (
        <div 
          key={contact.id || Math.random().toString()} 
          className={`flex items-center space-x-4 p-3 cursor-pointer transition-colors ${
            theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
          }`}
          onClick={() => onSelect && onSelect(contact)}
        >
          <div className="relative">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-transparent p-0.5">
              <img 
                src={contact?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + (contact?.name || "default")} 
                alt={contact?.name || "User"} 
                className="w-full h-full rounded-full object-cover" 
              />
            </div>
            {contact?.statuses && Array.isArray(contact.statuses) && contact.statuses.length > 0 && (
              <svg className="absolute top-0 left-0 w-14 h-14" viewBox="0 0 100 100">
                {contact.statuses.map((_, index) => {
                  const numStatuses = contact.statuses.length;
                  const angle = 360 / numStatuses;
                  const padding = numStatuses > 1 ? 4 : 0;
                  
                  return (
                    <circle
                      key={index}
                      cx="50"
                      cy="50"
                      r="48"
                      fill="none"
                      stroke="#25D366"
                      strokeWidth="3"
                      strokeDasharray={`${(2 * Math.PI * 48) / numStatuses - padding} ${padding}`}
                      strokeDashoffset={(2 * Math.PI * 48) / 4} // Start from top
                      transform={`rotate(${index * angle} 50 50)`}
                    />
                  )
                })}
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
              {contact?.name || "Unknown User"}
            </p>
            {contact?.statuses && Array.isArray(contact.statuses) && contact.statuses.length > 0 && (
              <p className={`text-sm truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {formatTimestamp(contact.statuses[contact.statuses.length - 1]?.timestamp)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default StatusList