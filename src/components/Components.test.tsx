import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDefaultGroups } from '../lib/defaults';
import { AppModal } from './AppModal';
import { ClockHero } from './ClockHero';
import { DevicesWidget } from './widgets/HomedashWidgets';
import { NotesWidget } from './widgets/NotesWidget';
import { TodosWidget } from './widgets/TodosWidget';

describe('核心组件渲染与交互冒烟测试', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ClockHero 支持时钟、日期与农历的独立显示控制', () => {
    const fixedDate = new Date(2024, 1, 10, 9, 5, 0); // 2024-02-10 09:05
    const { rerender } = render(<ClockHero showClock showDate showLunar nowOverride={fixedDate} />);

    expect(screen.getByText('09:05')).toBeInTheDocument();
    expect(screen.getByText(/2024年2月10日/)).toBeInTheDocument();
    expect(screen.getByText(/甲辰年（龙） 正月初一/)).toBeInTheDocument();

    rerender(<ClockHero showClock showDate={false} showLunar={false} nowOverride={fixedDate} />);
    expect(screen.getByText('09:05')).toBeInTheDocument();
    expect(screen.queryByText(/2024年2月10日/)).not.toBeInTheDocument();
  });

  it('AppModal 输入网址后自动预填域名并提交保存', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <AppModal
        mode="add"
        initialGroupId="work"
        groups={createDefaultGroups()}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        onToast={vi.fn()}
      />,
    );

    const urlInput = screen.getByLabelText('网址');
    await user.type(urlInput, 'https://vuejs.org');

    // 等待防抖自动填充名称
    const nameInput = screen.getByLabelText('名称') as HTMLInputElement;
    await waitFor(() => {
      expect(nameInput.value).toBe('vuejs.org');
    });

    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      name: 'vuejs.org',
      url: 'https://vuejs.org',
    });
  });

  it('未配置 homedash 时渲染中文提示且不发起网络请求', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    render(<DevicesWidget homedashUrl="" homedashToken="" onOpenSettings={vi.fn()} />);

    expect(screen.getByText('在设置中配置 homedash 地址后显示')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '去设置' })).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('待办与便签小组件支持本地交互更新', async () => {
    const user = userEvent.setup();
    const onTodoChange = vi.fn();
    render(<TodosWidget items={[]} onChange={onTodoChange} />);

    await user.type(screen.getByPlaceholderText('添加待办'), '提交周报');
    await user.click(screen.getByRole('button', { name: '添加' }));
    expect(onTodoChange).toHaveBeenCalledWith([
      expect.objectContaining({ text: '提交周报', done: false }),
    ]);

    const onNoteChange = vi.fn();
    render(<NotesWidget content="初始内容" onChange={onNoteChange} />);
    await user.type(screen.getByLabelText('便签内容'), '!');
    expect(onNoteChange).toHaveBeenCalledWith('初始内容!');
  });
});
