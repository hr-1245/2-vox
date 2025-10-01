import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { X } from "lucide-react";
// Child component
type AddTagsModalProps = {
  ghlTags: { id: string; name: string; locationId: string }[];
  editing: boolean;
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
  tags: string[];
  setNewTag: React.Dispatch<React.SetStateAction<string>>;
  handleAddTag: () => void; // <-- fixed,
  newTag: string;
  handleDeleteTag: (tagToDelete: string) => void;
};


export default function AddTagsModal({ ghlTags, editing, setTags, tags, setNewTag, handleAddTag, newTag, handleDeleteTag }: AddTagsModalProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // const tags = [
  //   "ai-reply",
  //   "follow-up",
  //   "high priority",
  //   "new tag",
  //   "new-inbound-lead",
  //   "warm lead",
  // ];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active{editing && "Add"} Tags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Header */}

        {/* Search Input */}
        {/* Search / Create Input */}
        {editing && (<input
          type="text"
          value={newTag}
          placeholder="Search / create tags"
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddTag();
            }
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />)}


        {/* Autocomplete Suggestions */}
        {editing ? (
          <>
            {/* Autocomplete results when typing */}
            {newTag && (
              <div className="border rounded-lg shadow bg-white max-h-40 overflow-y-auto mb-3 dark:bg-[#171717]">
                {tags
                  .filter((tag) => tag.toLowerCase().includes(newTag.toLowerCase()))
                  .map((tag) => (
                    <div
                      key={tag}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-blue-500 dark:hover:bg-[#171717]"
                      onClick={() => {
                        toggleTag(tag);
                        setNewTag("");
                      }}
                    >
                      {tag}
                    </div>
                  ))}

                {/* Create new tag option */}
                {!tags.some((t) => t.toLowerCase() === newTag.toLowerCase()) && (
                  <div
                    className="bg-blue-50 bg-white cursor-pointer dark:bg-[#171717] hover:bg-blue-100 px-3 py-2 text-blue-600"
                    onClick={handleAddTag}
                  >
                    ➕ Create "{newTag}"
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.length > 0 &&
                tags.map((tag, index) => (


                  <Button
                    key={index}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="justify-between"
                    onClick={() => handleDeleteTag(tag)}
                  // onClick={() => toggleTag(tag)}
                  >
                    {tag}
                    <X
                      className="w-4 h-4 cursor-pointer"
                      onClick={(e) => {
                        // e.stopPropagation() 
                        // prevents toggleTag from firing
                        handleDeleteTag(tag)
                      }}
                    />
                  </Button>

                  // <Button
                  //   key={index}
                  //   variant={selectedTags.includes(tag) ? "default" : "outline"}
                  //   className="justify-start"

                  //   onClick={() => toggleTag(tag)}
                  // >
                  //   {tag}
                  //   <X
                  //     className="w-4 h-4 cursor-pointer"
                  //     onClick={(e) => {
                  //       e.stopPropagation()
                  //       handleDeleteTag(tag)
                  //     }}
                  //   />
                  // </Button>
                ))}
            </div>
          </>
        ) : (
          <>
            {/* Just show selected tags in view mode */}
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedTags.length > 0 ? (
                selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.length > 0 &&
                    tags.map((tag, index) => (
                      <Button
                        key={index}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Button>
                    ))}
                </div>
              )}
            </div>
          </>
        )}


        {/* <input
          type="text"
          placeholder="Search / create tags"
          onChange={(e) => setNewTag(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Tag list */}
        {/* <div className="flex flex-wrap gap-2 mb-3">
  {tags.length > 0 &&
    tags.map((tag, index) => (
      <Button
        key={index}
        variant={selectedTags.includes(tag) ? "default" : "outline"}
        className="justify-start"
        onClick={() => toggleTag(tag)}
      >
        {tag}
      </Button>
    ))}
</div>  

        {/* Dropdown */}
        {/* <select className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>Please select tags</option>
          {tags.map((tag) => (
            <option key={tag}>{tag}</option>
          ))}
        </select> */}

        {editing && (
          <>
            <p>LeadConnector Tags</p>
            <Select
              onValueChange={(selected) => {
                if (selected && !tags.includes(selected)) {
                  setTags((prev) => [...prev, selected]);
                }
              }}
            >
              <SelectTrigger className="w-full mb-4">
                <SelectValue placeholder="Please select tags" />
              </SelectTrigger>

              <SelectContent>
                {ghlTags?.map((tag) => (
                  <SelectItem key={tag.id} value={tag.name}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        {/* Info box */}
        {/* <div className="flex items-start gap-2 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <span className="text-blue-500">ℹ️</span>
          <p>
            Bulk Actions are performed over period of time. You can track the
            progress on the Bulk Actions page.
          </p>
        </div> */}

        {/* Footer */}
        <div className="flex justify-end gap-2">
          {/* <button className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-100">
            Cancel
          </button>
          <button className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
            Add Tags
          </button> */}
          {/* <Button variant="outline" type="button">
            Cancel
          </Button>
          <Button type="submit">
            Add Tags
          </Button> */}
        </div>
      </CardContent>
    </Card>

  );
}
