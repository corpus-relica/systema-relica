class STChatHistory:
    def __init__(self) -> None:
        self._history = []

    def addChatHistory(self, msg):
        # self._history.append(msg)
        pass

    @property
    def history(self):
        return self._history

stChatHistory = STChatHistory()
