import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Send, Search, MessageSquare, ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { toast } from "sonner"

export default function Messages(){

const [user,setUser] = useState(null)
const [profile,setProfile] = useState(null)

const [conversations,setConversations] = useState([])
const [selectedConvo,setSelectedConvo] = useState(null)

const [messages,setMessages] = useState([])

const [newMessage,setNewMessage] = useState("")
const [loading,setLoading] = useState(true)
const [sending,setSending] = useState(false)

/* ------------------------------- */
/* LOAD USER */
/* ------------------------------- */

useEffect(()=>{
loadUser()
},[])

const loadUser = async()=>{

setLoading(true)

const { data } = await supabase.auth.getUser()

if(!data?.user){
setLoading(false)
return
}

setUser(data.user)

const { data:profileData } = await supabase
.from("profiles")
.select("*")
.eq("user_id",data.user.id)
.single()

setProfile(profileData)

await loadConversations(profileData.id)

setLoading(false)

}

/* ------------------------------- */
/* LOAD CONVERSATIONS */
/* ------------------------------- */

const loadConversations = async(profileId)=>{

if(!profileId) return

const { data, error } = await supabase
.from("conversations")
.select(`
id,
user_one,
user_two,
last_message,
last_message_time,
userOne:user_one(id,full_name),
userTwo:user_two(id,full_name)
`)
.or(`user_one.eq.${profileId},user_two.eq.${profileId}`)
.order("last_message_time",{ascending:false})

if(error){
console.error(error)
return
}

const convos = (data || []).map(convo=>{

const otherUser =
convo.user_one === profileId
? convo.userTwo
: convo.userOne

return{
id: convo.id,
otherId: otherUser?.id,
otherName: otherUser?.full_name || "User",
lastMessage: convo.last_message || "",
lastMessageTime: convo.last_message_time
}

})

setConversations(convos)

}

/* ------------------------------- */
/* LOAD MESSAGES */
/* ------------------------------- */

useEffect(()=>{
if(selectedConvo) loadMessages()
},[selectedConvo])

const loadMessages = async()=>{

if(!selectedConvo) return

const { data, error } = await supabase
.from("messages")
.select("*")
.eq("conversation_id",selectedConvo.id)
.order("created_date",{ascending:true})

if(error){
console.error(error)
return
}

setMessages(data || [])

}

/* ------------------------------- */
/* SEND MESSAGE */
/* ------------------------------- */

const handleSend = async()=>{

if(!newMessage.trim()) return
if(!profile || !selectedConvo) return

setSending(true)

const { error } = await supabase
.from("messages")
.insert({
conversation_id: selectedConvo.id,
sender_id: profile.id,
receiver_id: selectedConvo.otherId,
message: newMessage,
is_read: false
})

if(error){
toast.error("Message failed")
console.error(error)
}

await supabase
.from("conversations")
.update({
last_message:newMessage,
last_message_time:new Date().toISOString()
})
.eq("id",selectedConvo.id)

setNewMessage("")

await loadMessages()
await loadConversations(profile.id)

setSending(false)

}

/* ------------------------------- */
/* REALTIME */
/* ------------------------------- */

useEffect(()=>{

if(!profile) return

const channel = supabase
.channel("messages")
.on(
"postgres_changes",
{
event:"INSERT",
schema:"public",
table:"messages"
},
(payload)=>{

if(
payload.new.sender_id === profile.id ||
payload.new.receiver_id === profile.id
){

loadConversations(profile.id)

if(selectedConvo?.id === payload.new.conversation_id){
loadMessages()
}

}

}
)
.subscribe()

return ()=> supabase.removeChannel(channel)

},[profile,selectedConvo])

/* ------------------------------- */
/* LOADING */
/* ------------------------------- */

if(loading){

return(
<div className="p-6 lg:p-8">
<div className="animate-pulse">
<div className="h-8 bg-[#1E2430] rounded w-48 mb-6"/>
<div className="h-96 bg-[#1E2430] rounded-xl"/>
</div>
</div>
)

}

/* ------------------------------- */
/* UI */
/* ------------------------------- */

return(

<div className="p-6 lg:p-8">

<h1 className="text-2xl lg:text-3xl font-bold text-white mb-6">
Messages
</h1>

<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">

{/* conversations */}

<div className={`card-dark p-4 overflow-y-auto ${selectedConvo ? "hidden lg:block":""}`}>

<div className="relative mb-4">
<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"/>
<Input placeholder="Search messages..." className="input-dark pl-10"/>
</div>

{conversations.length > 0 ? (

<div className="space-y-2">

{conversations.map(convo=>(

<button
key={convo.id}
onClick={()=>setSelectedConvo(convo)}
className={`w-full text-left p-3 rounded-xl transition-all ${
selectedConvo?.id === convo.id
? "bg-[#FF6B3D]/10 border border-[#FF6B3D]"
: "hover:bg-[#0A0E1A]"
}`}
>

<div className="flex items-center justify-between mb-1">

<span className="font-medium text-white">
{convo.otherName}
</span>

</div>

<p className="text-sm text-gray-400 line-clamp-1">
{convo.lastMessage}
</p>

<p className="text-xs text-gray-600 mt-1">
{convo.lastMessageTime
? format(new Date(convo.lastMessageTime),"MMM d, h:mm a")
: ""}
</p>

</button>

))}

</div>

):(

<div className="text-center py-12">
<MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4"/>
<p className="text-gray-500">No conversations yet</p>
</div>

)}

</div>

{/* chat */}

<div className={`lg:col-span-2 card-dark flex flex-col ${!selectedConvo ? "hidden lg:flex":""}`}>

{selectedConvo ? (

<>

<div className="p-4 border-b border-[#1E2430] flex items-center gap-3">

<button
onClick={()=>setSelectedConvo(null)}
className="lg:hidden text-[#FF6B3D]"
>
<ArrowLeft className="w-5 h-5"/>
</button>

<div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B3D] to-[#FF5722] flex items-center justify-center">
<span className="font-semibold text-black">
{selectedConvo.otherName?.charAt(0)}
</span>
</div>

<p className="font-medium text-white">
{selectedConvo.otherName}
</p>

</div>

<div className="flex-1 overflow-y-auto p-4 space-y-4">

{messages.map(msg=>{

const isSent = msg.sender_id === profile.id

return(

<div key={msg.id} className={`flex ${isSent ? "justify-end":"justify-start"}`}>

<div
className={`max-w-[70%] rounded-2xl px-4 py-2 ${
isSent
? "bg-gradient-to-r from-[#FF6B3D] to-[#FF5722]"
: "bg-[#151922]"
}`}
>

<p style={{color:isSent ? "black":"white"}}>
{msg.message}
</p>

<p className={`text-xs mt-1 ${isSent ? "text-black/70":"text-gray-500"}`}>
{format(new Date(msg.created_date),"h:mm a")}
</p>

</div>

</div>

)

})}

</div>

<div className="p-4 border-t border-[#1E2430]">

<div className="flex gap-2">

<Textarea
value={newMessage}
onChange={e=>setNewMessage(e.target.value)}
placeholder="Type a message..."
className="input-dark resize-none"
rows={2}
/>

<Button
onClick={handleSend}
disabled={sending || !newMessage.trim()}
className="btn-primary"
>
<Send className="w-4 h-4"/>
</Button>

</div>

</div>

</>

):(

<div className="flex-1 flex items-center justify-center">

<div className="text-center">
<MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4"/>
<p className="text-gray-500">
Select a conversation to start messaging
</p>
</div>

</div>

)}

</div>

</div>

</div>

)

}