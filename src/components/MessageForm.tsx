import { useState } from "react";
import { toast } from "sonner";

export default function MessageForm({ currentUser, customerName, customerPhone, setMessages }) {
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (isSending) return;

    const trimmedMessage = messageInput.trim();

    if (!trimmedMessage) {
      toast.error("Please enter a message");
      return;
    }

    setIsSending(true);

    try {
      const payload = {
        name: customerName || "WoWo",
        phone: customerPhone || "",
        message: trimmedMessage,
        userId: currentUser?.id,
        username: currentUser?.username || "WoWo",
      };

      const response = await fetch("/api/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("Invalid server response");
      }

      console.log("[send-message] status:", response.status);
      console.log("[send-message] result:", result);

      if (!response.ok || result?.success === false) {
        throw new Error(
          result?.message ||
          result?.error?.message ||
          "Failed to send message"
        );
      }

      if (result?.data?.message) {
        setMessages((prev) => [...prev, result.data.message]);
      }

      setMessageInput("");
      toast.success(result?.message || "Message sent successfully");
    } catch (error) {
      console.error("[send-message] submit failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSendMessage} className="flex gap-2">
      <input
        value={messageInput}
        onChange={(e) => setMessageInput(e.target.value)}
        placeholder="Type your message"
        disabled={isSending}
        className="flex-1 border rounded px-3 py-2"
      />
      <button
        type="submit"
        disabled={isSending}
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
      >
        {isSending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
