Plan to implement                                                                          │
│                                                                                            │
│ Review System for Completed Transfers                                                      │
│                                                                                            │
│ Context                                                                                    │
│                                                                                            │
│ The backend for reviews (model, routes, controller) already exists but there's no way to   │
│ actually leave a review in the app. Users should be able to tap completed items in their   │
│ Past/Received tabs and leave a review for the other party. Additionally, profile ratings   │
│ are hardcoded (3.5 on own profile, 5.0 on public profiles) and need to show real data.     │
│                                                                                            │
│ What Already Exists                                                                        │
│                                                                                            │
│ - Review model (server/src/models/Review.ts): reviewer, reviewee, itemId, rating (1-5),    │
│ comment, unique constraint per reviewer+item                                               │
│ - Review controller (server/src/controllers/reviews.controller.ts): getReviewsForUser      │
│ (with avg calculation), createReview (with self-review + duplicate guards)                 │
│ - Review routes (server/src/routes/review.routes.ts): GET /reviews/user/:userId, POST      │
│ /reviews                                                                                   │
│ - Reviews display screen (app/reviews.tsx): shows reviews with sorting, star display       │
│ - Reviews service (services/reviews.service.ts): only has getForUser, missing create       │
│ - Review types (types/review.ts): Review and ReviewsResponse interfaces                    │
│                                                                                            │
│ Changes                                                                                    │
│                                                                                            │
│ 1. services/reviews.service.ts — add create method                                         │
│                                                                                            │
│ Add to the existing service object:                                                        │
│ create: async (data: { revieweeId: string; itemId: string; rating: number; comment: string │
│  }): Promise<Review> => {                                                                  │
│     const { data: review } = await api.post<Review>('/reviews', data);                     │
│     return review;                                                                         │
│ },                                                                                         │
│                                                                                            │
│ 2. Create app/review/[id].tsx — Review form screen                                         │
│                                                                                            │
│ - Route: /review/:id where id is the itemId                                                │
│ - Fetches item via itemsService.getById(id) to get postedBy/receivedBy                     │
│ - Determines who to review: if current user is seller (postedBy) → review buyer            │
│ (receivedBy); if buyer → review seller                                                     │
│ - Shows: item thumbnail + title, reviewee username + avatar (use Ionicons person-circle    │
│ fallback like receipt screen)                                                              │
│ - Star rating picker: 5 tappable star icons, filled/outlined based on selection            │
│ - Optional comment: TextInput with placeholder "Add a comment (optional)"                  │
│ - Submit button → calls reviewsService.create({ revieweeId, itemId, rating, comment }) →   │
│ on success router.back()                                                                   │
│ - Error handling: alert for "already reviewed" (duplicate key error) and other errors      │
│ - Use app's color palette: Colors.background, Colors.primary, Colors.text, etc.            │
│ - Header with back button matching the style in app/transfer/qr-generate.tsx               │
│                                                                                            │
│ 3. app/item/[id].tsx — replace "No Longer Available" with "Leave a Review" for             │
│ participants                                                                               │
│                                                                                            │
│ Current code at lines 400-410 shows a disabled "No Longer Available" bar for all completed │
│  items. Change to:                                                                         │
│ - If item.status === "completed" AND current user is the seller (user._id ===              │
│ postedBy._id) or buyer (user._id === receivedBy._id): show a "Leave a Review" button (use  │
│ Colors.primary background, same rounded-full style as other buttons)                       │
│ - On press: router.push(/review/${item._id})                                               │
│ - If user is neither seller nor buyer: keep "No Longer Available" disabled bar             │
│ - Note: getItem endpoint already populates receivedBy (username, avatarUrl). The           │
│ receivedBy field needs to be extracted the same way postedBy is at line 137-139. Add:      │
│ const receivedBy = typeof item.receivedBy === "object" && item.receivedBy !== null         │
│     ? item.receivedBy as { _id: string; username: string }                                 │
│     : null;                                                                                │
│                                                                                            │
│ 4. app/(tabs)/profile.tsx — fetch and display real rating                                  │
│                                                                                            │
│ - Import reviewsService from ../../services/reviews.service                                │
│ - Add state: const [avgRating, setAvgRating] = useState<number>(0);                        │
│ - In the existing fetchData callback, add reviewsService.getForUser(user._id) to the       │
│ Promise.all and extract avgRating from the response                                        │
│ - Replace hardcoded 3.5 at line 192 with avgRating state variable                          │
│ - Replace hardcoded 3.5 text at line 220 with avgRating (or "New" if 0)                    │
│ - Also refresh rating in onRefresh                                                         │
│                                                                                            │
│ 5. app/profile/[id].tsx — fetch and display real rating                                    │
│                                                                                            │
│ - Same pattern as above but for public profiles                                            │
│ - Import reviewsService, add avgRating state                                               │
│ - Fetch on mount using the profile's id param                                              │
│ - Replace hardcoded 5.0 at line 200 and 5.0 text at line 220                               │
│                                                                                            │
│ Build Order                                                                                │
│                                                                                            │
│ 1. Add create to services/reviews.service.ts                                               │
│ 2. Create app/review/[id].tsx (review form screen)                                         │
│ 3. Update app/item/[id].tsx — "Leave a Review" button for completed items                  │
│ 4. Update app/(tabs)/profile.tsx — dynamic rating from API                                 │
│ 5. Update app/profile/[id].tsx — dynamic rating from API                                   │
│                                                                                            │
│ Key Files                                                                                  │
│                                                                                            │
│ - services/reviews.service.ts (modify — add create method)                                 │
│ - app/review/[id].tsx (create — new review form screen)                                    │
│ - app/item/[id].tsx (modify — lines 400-410, completed item bottom button)                 │
│ - app/(tabs)/profile.tsx (modify — lines 191-220, hardcoded rating)                        │
│ - app/profile/[id].tsx (modify — lines 199-220, hardcoded rating)                          │
│ - types/review.ts (reference only — Review, ReviewsResponse interfaces)                    │
│ - server/src/controllers/reviews.controller.ts (reference only — createReview accepts {    │
│ revieweeId, itemId, rating, comment })                                                     │
│ - constants/Colors.ts (reference only — app color palette)                                 │
│                                                                                            │
│ Style Reference                                                                            │
│                                                                                            │
│ - Background: Colors.background (#fae5c4)                                                  │
│ - Primary/buttons: Colors.primary (#a8c9a8)                                                │
│ - Text: Colors.text (#411e12)                                                              │
│ - Secondary text: Colors.textSecondary (#96755f)                                           │
│ - Card surface: Colors.surface (#fffcf6)                                                   │
│ - Stars use Colors.primary for filled, outline for empty                                   │
│ - Buttons use rounded-full py-4 pattern with Quicksand_600SemiBold font                    │
│                                                                                            │
│ Verification                                                                               │
│                                                                                            │
│ 1. Complete a transfer between two accounts                                                │
│ 2. Seller opens completed item from Past tab → sees "Leave a Review" → taps → review form  │
│ 3. Seller rates buyer with stars + comment → submits → returns to item                     │
│ 4. Buyer does the same from Received tab                                                   │
│ 5. Both profiles now show real average ratings (not hardcoded)                             │
│ 6. Attempting to review the same item again shows "already reviewed" error                 │
│ 7. Reviews screen shows the new reviews with correct data