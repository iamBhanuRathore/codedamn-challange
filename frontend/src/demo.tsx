import React, {
  useState,
  useRef,
  useEffect,
  ChangeEvent,
  KeyboardEvent,
} from "react";
import axios from "axios";

interface RoomData {
  content: string;
  last_modified?: string;
}

const Homepage: React.FC = () => {
  const [roomId, setRoomId] = useState<string>(
    localStorage.getItem("localRoomId") || ""
  );
  const [resData, setResData] = useState<RoomData>({ content: "" });
  const [roomContent, setRoomContent] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [saveMsg, setSaveMsg] = useState<string>("saved.");
  const [isRoomIdChanged, setRoomIdChanged] = useState<boolean>(true);

  const now = (): string => {
    const tzoffset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzoffset)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
  };

  const handleRoomBlur = () => {
    if (roomId.length > 0 && isRoomIdChanged) {
      axios
        .post("http://localhost:3001/api/createroom", {
          room_id: roomId,
        })
        .then(({ data }) => {
          if (data.status === "success") {
            setResData({ content: "" });
            setRoomContent("");
          } else if (data.status === "already") {
            setResData({
              ...data.data,
              last_modified: getDateFormat(data.data.last_modified),
            });
            setRoomContent(data.data.content);
          }
          setSaveMsg("saved.");
          setRoomIdChanged(false);
          localStorage.setItem("localRoomId", roomId);
        })
        .catch((err) => setError(err));
    }
  };

  useEffect(() => {
    const timeOutId = setTimeout(() => {
      if (roomId.length > 0 && resData.content !== roomContent) {
        axios
          .post("http://localhost:3001/api/updateroom", {
            room_id: roomId,
            content: roomContent,
            last_modified: now(),
          })
          .then(() => {
            setSaveMsg("saved.");
            setResData({
              ...resData,
              last_modified: getDateFormat(now()),
            });
          })
          .catch((err) => {
            console.log(err);
          });
      }
    }, 1000);

    return () => {
      clearTimeout(timeOutId);
    };
  }, [roomId, roomContent]);

  const handleRoomIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    setRoomId(e.target.value);
    setRoomIdChanged(true);
  };

  const handleRoomContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setRoomContent(e.target.value);
    roomId.length > 0 && setSaveMsg("saving....");
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleRoomBlur();
    }
  };

  return (
    <>
      {error ? (
        <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
          <p>Some Error Occured</p>
        </div>
      ) : (
        <div className="container">
          <p className="header">Text Sharing Platform</p>
          <input
            className="room_id"
            id="room_id"
            type="text"
            placeholder="Enter room id"
            value={roomId}
            onChange={handleRoomIdChange}
            onBlur={handleRoomBlur}
            onKeyPress={handleKeyPress}
            autoFocus
          />

          <textarea
            className="room_content"
            placeholder="Your content..."
            value={roomContent}
            onChange={handleRoomContentChange}
          />

          <div className="footer">
            <div className="character">
              {roomId.length > 0
                ? `No character ${saveMsg}`
                : `${roomContent.length} character ${saveMsg}`}
            </div>
            <div className="date-time">{resData.last_modified}</div>
          </div>
        </div>
      )}
    </>
  );
};

const getDateFormat = (dateStr: string): string => {
  const options: any = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  return `Last Modified - ${new Date(dateStr).toLocaleString(
    "en-US",
    options
  )}`;
};

export default Homepage;
