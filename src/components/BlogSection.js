import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import './BlogSection.css';
import { toast } from 'react-hot-toast';

const BlogSection = ({ userId, isCurrentUser }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        image_url: '',
        published: true
    });
    const [editingId, setEditingId] = useState(null);
    
    useEffect(() => {
        fetchPosts();
    }, [userId]);
    
    const fetchPosts = async () => {
        try {
            setLoading(true);
            
            let query = supabase
                .from('blog_posts')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
                
            // If not the current user, only show published posts
            if (!isCurrentUser) {
                query = query.eq('published', true);
            }
            
            const { data, error } = await query;
                
            if (error) {
                throw error;
            }
            
            setPosts(data || []);
        } catch (error) {
            console.error('Error fetching blog posts:', error);
            toast.error('Failed to load blog posts');
        } finally {
            setLoading(false);
        }
    };
    
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            let result;
            
            if (editingId) {
                // Update existing post
                result = await supabase
                    .from('blog_posts')
                    .update({
                        title: formData.title,
                        content: formData.content,
                        image_url: formData.image_url,
                        published: formData.published,
                        updated_at: new Date()
                    })
                    .eq('id', editingId);
                    
                toast.success('Blog post updated successfully');
            } else {
                // Create new post
                result = await supabase
                    .from('blog_posts')
                    .insert({
                        user_id: userId,
                        title: formData.title,
                        content: formData.content,
                        image_url: formData.image_url,
                        published: formData.published
                    });
                    
                toast.success('Blog post created successfully');
            }
            
            if (result.error) {
                throw result.error;
            }
            
            // Reset form and refresh posts
            resetForm();
            fetchPosts();
        } catch (error) {
            console.error('Error saving blog post:', error);
            toast.error('Failed to save blog post');
        }
    };
    
    const handleEdit = (post) => {
        setFormData({
            title: post.title,
            content: post.content,
            image_url: post.image_url || '',
            published: post.published
        });
        setEditingId(post.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this post?')) {
            return;
        }
        
        try {
            const { error } = await supabase
                .from('blog_posts')
                .delete()
                .eq('id', id);
                
            if (error) {
                throw error;
            }
            
            setPosts(posts.filter(post => post.id !== id));
            toast.success('Blog post deleted successfully');
        } catch (error) {
            console.error('Error deleting blog post:', error);
            toast.error('Failed to delete blog post');
        }
    };
    
    const resetForm = () => {
        setFormData({
            title: '',
            content: '',
            image_url: '',
            published: true
        });
        setEditingId(null);
        setShowForm(false);
    };
    
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };
    
    if (loading) {
        return <div className="blog-loading">Loading blog posts...</div>;
    }
    
    // Ensure posts is not null before rendering
    const safePosts = posts || [];
    
    return (
        <div className="blog-section">
            <div className="blog-header">
                <h2>Blog Posts</h2>
                {isCurrentUser && !showForm && (
                    <button 
                        className="new-post-btn"
                        onClick={() => setShowForm(true)}
                    >
                        New Post
                    </button>
                )}
            </div>
            
            {isCurrentUser && showForm && (
                <div className="blog-form-container">
                    <h3>{editingId ? 'Edit Post' : 'Create New Post'}</h3>
                    <form onSubmit={handleSubmit} className="blog-form">
                        <div className="form-group">
                            <label htmlFor="title">Title</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="content">Content</label>
                            <textarea
                                id="content"
                                name="content"
                                value={formData.content}
                                onChange={handleInputChange}
                                rows={10}
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="image_url">Image URL (optional)</label>
                            <input
                                type="url"
                                id="image_url"
                                name="image_url"
                                value={formData.image_url}
                                onChange={handleInputChange}
                            />
                        </div>
                        
                        <div className="form-group checkbox-group">
                            <input
                                type="checkbox"
                                id="published"
                                name="published"
                                checked={formData.published}
                                onChange={handleInputChange}
                            />
                            <label htmlFor="published">Publish this post</label>
                        </div>
                        
                        <div className="form-actions">
                            <button type="submit" className="submit-btn">
                                {editingId ? 'Update Post' : 'Create Post'}
                            </button>
                            <button 
                                type="button" 
                                className="cancel-btn"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
            
            <div className="blog-posts">
                {safePosts.length === 0 ? (
                    <div className="no-posts">
                        {isCurrentUser 
                            ? 'You haven\'t created any blog posts yet. Click "New Post" to get started!'
                            : 'This user hasn\'t published any blog posts yet.'}
                    </div>
                ) : (
                    safePosts.map(post => (
                        <div key={post.id} className={`blog-post ${!post.published ? 'draft' : ''}`}>
                            {!post.published && isCurrentUser && (
                                <div className="draft-badge">Draft</div>
                            )}
                            
                            {post.image_url && (
                                <div className="post-image">
                                    <img 
                                        src={post.image_url} 
                                        alt={post.title}
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/800x400?text=Image+Not+Found';
                                        }}
                                    />
                                </div>
                            )}
                            
                            <div className="post-content">
                                <h3>{post.title}</h3>
                                <div className="post-meta">
                                    <span className="post-date">
                                        {formatDate(post.created_at)}
                                    </span>
                                    {post.created_at !== post.updated_at && (
                                        <span className="post-updated">
                                            (Updated: {formatDate(post.updated_at)})
                                        </span>
                                    )}
                                </div>
                                
                                <div className="post-body">
                                    {post.content.split('\n').map((paragraph, i) => (
                                        paragraph ? <p key={i}>{paragraph}</p> : <br key={i} />
                                    ))}
                                </div>
                                
                                {isCurrentUser && (
                                    <div className="post-actions">
                                        <button 
                                            className="edit-btn"
                                            onClick={() => handleEdit(post)}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            className="delete-btn"
                                            onClick={() => handleDelete(post.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default BlogSection; 