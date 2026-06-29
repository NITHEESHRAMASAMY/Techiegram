import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors

class RecommendationEngine:
    def __init__(self):
        pass

    def compute_trending_posts(self, posts, interactions, limit=10):
        """
        Trending Engine: Calculate trending score based on engagements.
        Score = Likes*10 + Comments*20 + Saves*30 + WatchTime*2
        """
        if not posts:
            return []

        df_interactions = pd.DataFrame(interactions) if interactions else pd.DataFrame()

        if df_interactions.empty:
            return [str(p["_id"]) for p in posts[:limit]]

        engagement_scores = {}
        for post in posts:
            pid = str(post["_id"])
            post_int = df_interactions[df_interactions["post"] == pid]
            
            likes = len(post_int[post_int["type"] == "like"])
            comments = len(post_int[post_int["type"] == "comment"])
            saves = len(post_int[post_int["type"] == "save"])
            
            watch_time = 0
            if not post_int.empty and "watchTime" in post_int.columns:
                watch_time = post_int[post_int["type"] == "view"]["watchTime"].sum()
            
            score = (likes * 10) + (comments * 20) + (saves * 30) + (watch_time * 2)
            engagement_scores[pid] = score

        sorted_pids = sorted(engagement_scores.keys(), key=lambda x: engagement_scores[x], reverse=True)
        return sorted_pids[:limit]

    def get_recommendations(self, target_user_id, users, posts, interactions, limit=10):
        """
        Hybrid Recommendations: KNN Collaborative Filtering + Content-Based tag matching + Trending fallback.
        """
        if not posts:
            return []

        target_user_id = str(target_user_id)
        df_interactions = pd.DataFrame(interactions) if interactions else pd.DataFrame()

        # Fallback to trending if there are not enough interactions to calculate similarity
        if df_interactions.empty or len(df_interactions["user"].unique()) < 2:
            return self.compute_trending_posts(posts, interactions, limit)

        # 1. KNN Collaborative Filtering
        try:
            # Map interactions to weights
            weight_map = {"view": 1, "like": 3, "comment": 4, "save": 5}
            df_interactions["weight"] = df_interactions["type"].map(weight_map).fillna(1)
            
            # Aggregate weights
            matrix_df = df_interactions.groupby(["user", "post"])["weight"].sum().reset_index()
            
            # Pivot to create User-Item Matrix
            interaction_matrix = matrix_df.pivot(index="user", columns="post", values="weight").fillna(0)
            
            # If target user does not have history, bypass to content-based or trending
            if target_user_id in interaction_matrix.index:
                # Fit KNN model
                model_knn = NearestNeighbors(metric="cosine", algorithm="brute", n_neighbors=min(5, len(interaction_matrix)))
                model_knn.fit(interaction_matrix.values)

                # Locate target index
                user_idx = interaction_matrix.index.get_loc(target_user_id)
                distances, indices = model_knn.kneighbors(
                    interaction_matrix.iloc[user_idx, :].values.reshape(1, -1), 
                    n_neighbors=min(5, len(interaction_matrix))
                )

                # Extract candidates from matching neighbors
                recommendation_candidates = {}
                similar_user_indices = indices.flatten()[1:] # Skip self
                
                for idx in similar_user_indices:
                    sim_user_id = interaction_matrix.index[idx]
                    sim_user_profile = interaction_matrix.loc[sim_user_id]
                    
                    for pid, weight in sim_user_profile.items():
                        if weight > 0:
                            # Exclude posts already seen by target user
                            target_profile = interaction_matrix.loc[target_user_id]
                            if target_profile[pid] == 0:
                                recommendation_candidates[pid] = recommendation_candidates.get(pid, 0) + weight

                cf_pids = sorted(recommendation_candidates.keys(), key=lambda x: recommendation_candidates[x], reverse=True)
                
                if cf_pids:
                    print(f"Collaborative filtering suggestions: {cf_pids}")
                    if len(cf_pids) < limit:
                        # Append trending fallback to complete limit
                        trending = self.compute_trending_posts(posts, interactions, limit)
                        for pid in trending:
                            if pid not in cf_pids and pid not in interaction_matrix.loc[target_user_id].index[interaction_matrix.loc[target_user_id] > 0]:
                                cf_pids.append(pid)
                    return cf_pids[:limit]
        except Exception as e:
            print("Collaborative Filtering KNN error, falling back:", e)

        # 2. Content-Based tag matching fallback
        try:
            user_int = df_interactions[df_interactions["user"] == target_user_id]
            if not user_int.empty:
                interacted_pids = user_int["post"].unique()
                liked_posts = [p for p in posts if str(p["_id"]) in interacted_pids]
                favorite_tags = []
                for lp in liked_posts:
                    favorite_tags.extend(lp.get("hashtags", []))
                
                tag_counts = pd.Series(favorite_tags).value_counts()
                top_tags = list(tag_counts.head(5).index)
                
                content_scores = {}
                for post in posts:
                    pid = str(post["_id"])
                    if pid in interacted_pids:
                        continue
                    
                    matches = len(set(post.get("hashtags", [])).intersection(top_tags))
                    content_scores[pid] = matches
                
                cb_pids = sorted(content_scores.keys(), key=lambda x: content_scores[x], reverse=True)
                if cb_pids and content_scores[cb_pids[0]] > 0:
                    print("Content-based recommendation fallback completed.")
                    return cb_pids[:limit]
        except Exception as cb_err:
            print("Content-based recommendation error:", cb_err)

        # 3. Trending engine final fallback
        return self.compute_trending_posts(posts, interactions, limit)
