-- Send a plain-text email via Mail.app using the default account.
-- Usage: osascript ops/send-mail.applescript "<subject>" "<body>" "<recipient>"
-- Arguments are passed as argv so dynamic content is never interpolated into
-- the script source (no escaping / injection concerns).
on run argv
	if (count of argv) < 3 then error "expected: subject body recipient"
	set theSubject to item 1 of argv
	set theBody to item 2 of argv
	set theAddr to item 3 of argv
	tell application "Mail"
		if not running then launch
		set newMessage to make new outgoing message with properties {subject:theSubject, content:theBody, visible:false}
		tell newMessage
			make new to recipient at end of to recipients with properties {address:theAddr}
		end tell
		-- Mail's synchronous send can exceed the default 120s AppleEvent timeout
		-- while SMTP delivers; widen it so a slow-but-successful send doesn't error.
		with timeout of 300 seconds
			send newMessage
		end timeout
	end tell
end run
