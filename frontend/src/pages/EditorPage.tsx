import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES, createRoutes } from '@/lib/routes';
import { useCreateArticle, useUpdateArticle, useArticle } from '@/hooks/useArticles';
import { ErrorMessage } from '@/components/ui/error';

const EditorPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isEditMode = !!slug;
  
  const { data: articleData, isLoading: articleLoading } = useArticle(isEditMode ? slug : undefined);
  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    body: '',
    tagList: [] as string[],
  });
  
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate(ROUTES.LOGIN);
    }
  }, [user, navigate]);

  // Load article data for editing
  useEffect(() => {
    if (isEditMode && articleData?.article) {
      const article = articleData.article;
      
      // Check if user is the author
      if (article.author.username !== user?.username) {
        navigate(ROUTES.HOME);
        return;
      }
      
      setFormData({
        title: article.title,
        description: article.description,
        body: article.body,
        tagList: article.tagList || [],
      });
    }
  }, [isEditMode, articleData, user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !formData.tagList.includes(tag)) {
        setFormData(prev => ({
          ...prev,
          tagList: [...prev.tagList, tag]
        }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tagList: prev.tagList.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.body.trim()) {
      newErrors.body = 'Body is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (isEditMode && slug) {
        const result = await updateMutation.mutateAsync({
          slug,
          article: {
            title: formData.title,
            description: formData.description,
            body: formData.body,
            tagList: formData.tagList,
          }
        });
        navigate(createRoutes.articleDetail((result as { article: { slug: string } }).article.slug));
      } else {
        const result = await createMutation.mutateAsync({
          title: formData.title,
          description: formData.description,
          body: formData.body,
          tagList: formData.tagList,
        });
        navigate(createRoutes.articleDetail((result as { article: { slug: string } }).article.slug));
      }
    } catch (error: unknown) {
      console.error('Failed to save article:', error);
      // Handle API errors
      const axiosError = error as { response?: { data?: { errors?: Record<string, string> } } };
      if (axiosError.response?.data?.errors) {
        setErrors(axiosError.response.data.errors);
      }
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const apiError = createMutation.error || updateMutation.error;

  if (isEditMode && articleLoading) {
    return (
      <div className="editor-page">
        <div className="realworld-container" style={{ padding: '2rem 15px' }}>
          <div className="text-center py-8">
            <p className="text-gray-500">Loading article...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-page">
      <div className="realworld-container" style={{ padding: '2rem 15px' }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-medium mb-8 text-center">
            {isEditMode ? 'Edit Article' : 'New Article'}
          </h1>

          {apiError && (
            <div className="mb-6">
              <ErrorMessage 
                message={apiError instanceof Error ? apiError.message : 'Failed to save article'} 
                className="text-center text-red-500"
              />
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <fieldset style={{ border: 'none', padding: '0', margin: '0' }}>
              <fieldset className="form-group mb-4">
                <input
                  name="title"
                  type="text"
                  placeholder="Article Title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="form-control"
                  disabled={isLoading}
                  style={{
                    fontSize: '1.5rem',
                    padding: '0.75rem',
                    border: errors.title ? '1px solid #d9534f' : '1px solid #ccc'
                  }}
                />
                {errors.title && (
                  <div style={{ color: '#d9534f', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    <ErrorMessage message={errors.title} />
                  </div>
                )}
              </fieldset>

              <fieldset className="form-group mb-4">
                <input
                  name="description"
                  type="text"
                  placeholder="What's this article about?"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-control"
                  disabled={isLoading}
                  style={{
                    fontSize: '1rem',
                    padding: '0.75rem',
                    border: errors.description ? '1px solid #d9534f' : '1px solid #ccc'
                  }}
                />
                {errors.description && (
                  <div style={{ color: '#d9534f', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    <ErrorMessage message={errors.description} />
                  </div>
                )}
              </fieldset>

              <fieldset className="form-group mb-4">
                <textarea
                  name="body"
                  placeholder="Write your article (in markdown)"
                  rows={8}
                  value={formData.body}
                  onChange={handleInputChange}
                  className="form-control resize-none"
                  disabled={isLoading}
                  style={{
                    fontSize: '1rem',
                    padding: '0.75rem',
                    border: errors.body ? '1px solid #d9534f' : '1px solid #ccc'
                  }}
                />
                {errors.body && (
                  <div style={{ color: '#d9534f', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    <ErrorMessage message={errors.body} />
                  </div>
                )}
              </fieldset>

              <fieldset className="form-group mb-4">
                <input
                  type="text"
                  placeholder="Enter tags (press Enter to add)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyPress}
                  className="form-control"
                  disabled={isLoading}
                  style={{
                    fontSize: '1rem',
                    padding: '0.75rem',
                    border: '1px solid #ccc'
                  }}
                />
                
                {formData.tagList.length > 0 && (
                  <div className="tag-list mt-2">
                    {formData.tagList.map((tag, index) => (
                      <span key={index} className="tag-default tag-pill mr-1 mb-1 inline-flex items-center">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-white hover:text-gray-200"
                          disabled={isLoading}
                        >
                          <i className="ion-close-round"></i> ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </fieldset>

              <button 
                type="submit" 
                className="btn-realworld btn-primary pull-xs-right"
                disabled={isLoading}
                style={{
                  fontSize: '1rem',
                  padding: '0.75rem 1.5rem',
                  float: 'right'
                }}
              >
                {isLoading 
                  ? (isEditMode ? 'Updating...' : 'Publishing...')
                  : (isEditMode ? 'Update Article' : 'Publish Article')
                }
              </button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;