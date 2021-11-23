--Remove all memebers from all chats
DELETE FROM ChatMembers;

--Remove all messages from all chats
DELETE FROM Messages;

--Remove all chats
DELETE FROM Chats;

--Create Test Chat room, ChatId 1
INSERT INTO
    chats(chatid, name)
VALUES
    (1, 'Test Chat')
RETURNING *;

--Create Test Chat room, ChatId 2
INSERT INTO
    chats(chatid, name)
VALUES
    (2, 'Test Chat 2')
RETURNING *;

--Create Test Chat room, ChatId 53
INSERT INTO
    chats(chatid, name)
VALUES
    (53, 'Test Chat 53')
RETURNING *;

--Add the test users
INSERT INTO 
    ChatMembers(ChatId, MemberId)
SELECT 1, Members.MemberId
FROM Members
WHERE Members.Email='justinaschenbrenner@gmail.com'
    OR Members.Email='justina3@uw.edu'
    OR Members.Email='groupscruffy@gmail.com'
    OR Members.Email='ozvznqytvfezwroiff@sdvrecft.com'
RETURNING *;

--Add the test users
INSERT INTO 
    ChatMembers(ChatId, MemberId)
SELECT 2, Members.MemberId
FROM Members
WHERE Members.Email='justina3@uw.edu'
    OR Members.Email='groupscruffy@gmail.com'
    OR Members.Email='ozvznqytvfezwroiff@sdvrecft.com'
RETURNING *;

--Add the test users
INSERT INTO 
    ChatMembers(ChatId, MemberId)
SELECT 53, Members.MemberId
FROM Members
WHERE Members.Email='justinaschenbrenner@gmail.com'
    OR Members.Email='groupscruffy@gmail.com'
    OR Members.Email='ozvznqytvfezwroiff@sdvrecft.com'
RETURNING *;